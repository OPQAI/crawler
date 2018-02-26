// // 'use strict'

const request = require('superagent')
const cheerio = require('cheerio')
const fs = require('fs-extra')
const path = require('path')


/**
 * 生成[n, m]随机数
 * @param {number} min 
 * @param {number} max 
 */
function random(min, max) {
    let range = max - min
    let rand = Math.random()
    let num = min + rand * range
    return num
}

function rand(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

/**
 * 获取图集的URL
 */
async function getUrl(url) {
    let linkArr = []
    var res = await request.get(url + 1)
    var $ = cheerio.load(res.text)

    let text = $('.page .info').text()
    text = text.replace('共', '').replace('页', '')
    let pageNum = Number(text) || 10;
    console.log(`共${pageNum}页`)

    for (let i = 1; i <= pageNum; i++) {
        res = await request.get(url + i)
        $ = cheerio.load(res.text)
        $('.pic ul li').each(function(i, elem) {
            let link = $(this).find('a').attr('href')
            linkArr.push(link)
        })
    }
    return linkArr
}

//检测文件或者文件夹存在 nodeJS
function fsExistsSync(path) {
    try {
        fs.accessSync(path, fs.F_OK);
    } catch (e) {
        return false;
    }
    return true;
}

/**
 * 获取图集中的图片
 * @param {string} url 图集URL
 */
async function getPic(url, seriesName) {
    const res = await request.get(url)
    const $ = cheerio.load(res.text)
    // 以图集名称来分目录  
    const dir = $('.article h2').text()

    // 套图名
    var dirSeriesName = path.join(__dirname, '/mm/', seriesName);
    // 套图下面的子文件夹
    var dirChildName = path.join(__dirname, '/mm/', seriesName, dir);
    if (fsExistsSync(dirSeriesName)) {
        if (fsExistsSync(dirChildName) && dir !== '') {
            console.log('文件夹已存在！');
            return;
        } else {
            console.log(`创建${dirChildName}文件夹`)
            await fs.mkdir(dirChildName)
        }
    } else {
        console.log(`创建系列${dirSeriesName}文件夹`)
        await fs.mkdir(dirSeriesName)

        if (fsExistsSync(dirChildName) && dir == '') {
            console.log('文件夹已存在！');
            return;
        } else {
            console.log(`创建${dirChildName}文件夹`)
            await fs.mkdir(dirChildName)
        }
    }


    const pageCount = parseInt($('#page .ch.all').prev().text()) || 10;
    console.log(`共${pageCount}张图片`);
    for (let i = 1; i <= pageCount; i++) {
        let pageUrl = url + '/' + i
        console.log('正在请求：', pageUrl);
        const data = await request.get(pageUrl)
        const _$ = cheerio.load(data.text)
        // 获取图片的真实地址
        const imgUrl = _$('#content img').attr('src')
        await download(seriesName, dir, imgUrl, dirChildName, pageCount)
        await sleep(random(300, 600))
    }
    console.log(`该图集${pageCount}张图片已下载完成：${dir}`);
}

// 下载图片
function download(seriesName, dir, imgUrl, dirChildName, pageCount) {
    console.log(`正在下载${imgUrl}，共${pageCount}张图片`)
    const filename = imgUrl.split('/').pop()
    const req = request.get(imgUrl)
        .set({ 'Referer': 'http://www.mmjpg.com' })
    req.pipe(fs.createWriteStream(path.join(__dirname, 'mm', seriesName, dir, filename)))
    // req.pipe(fs.createWriteStream(path.join(dirChildName, filename)))
}


// sleep函数
function sleep(time) {
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            try {
                resolve(1);
            } catch (e) {
                reject(0);
            }
        }, time)
    })
};


// 取到所有标签对象
async function getAllTag(addr) {
    const res = await request.get(addr)
    const $ = cheerio.load(res.text)

    var ele = $('.tag ul li');

    var childArr = ele;
    console.log(childArr.length);

    var tagObj = {};

    var aEle = '';
    var href = '';
    var tag = '';
    var name = '';

    $('.tag ul li').each(function(i, elem) {
        $aEle = $(this).find('a');
        href = $aEle.attr('href');
        // console.log(href);

        tag = href.split('tag/')[1];
        name = $aEle.text();

        tagObj[tag] = name;
    })

    // console.log(tagObj);
    return tagObj;
}

// 取得的对象示例
// tagObj = {
//     'ailin': "琳琳"
//     'angle': "小甜"
// }



async function getSeriesImg(url, seriesName) {
    let urls = await getUrl(url);
    for (let address of urls) {
        await getPic(address, seriesName)
    }
}

let url = 'http://www.mmjpg.com/tag/meitui/'

var baseURL = 'http://www.mmjpg.com/tag/';
var seriesName = '';

async function init(url) {
    var tagObj = await getAllTag('http://www.mmjpg.com/more/');

    var keys = Object.keys(tagObj);
    var len = keys.length;

    var key = '';
    var n = '';

    // for (var n in tagObj) {
    for (var i = 0; i < 100; i++) {
        // if (tagObj.hasOwnProperty(n)) {
        key = keys[rand(0, len - 1)];
        url = baseURL + key + '/';
        seriesName = tagObj[key];
        console.log(`正在下载${seriesName}套图：${url}`);
        await getSeriesImg(url, seriesName);
        // }
    }
}

init(url)