// 可以使用以下命令运行
// node --inspect-brk app.js
// 然后打开：chrome:inspect
// 或
// inspect app.js

const request = require('superagent');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const dns = require('dns');

dns.lookup(`www.mmjpg.com`, 4, (err, ip) => {
    console.log('ip: ', ip);
})

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
function isExists(pathname) {
    try {
        fs.accessSync(pathname, fs.F_OK);
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
    const childName = $('.article h2').text()

    // 套图名
    var fatherSeriesName = path.join(__dirname, '/mm/', seriesName);
    // 套图下面的子文件夹
    var childSeriesName = path.join(__dirname, '/mm/', seriesName, childName);
    if (isExists(fatherSeriesName)) {
        if (isExists(childSeriesName) && childName !== '') {
            console.log('文件夹已存在！');
            return;
        } else {
            console.log(`创建${childSeriesName}文件夹`)
            fs.mkdirSync(childSeriesName)
        }
    } else {
        console.log(`创建系列${fatherSeriesName}文件夹`)
        fs.mkdirSync(fatherSeriesName)

        if (isExists(childSeriesName)) {
            console.log('子文件夹已存在！');
            return;
        } else {
            console.log(`创建${childSeriesName}文件夹`)
            fs.mkdirSync(childSeriesName)
        }
    }


    const pageCount = parseInt($('#page .ch.all').prev().text()) || 10;
    console.log(`共${pageCount}张图片`);
    for (let i = 1; i <= pageCount; i++) {
        let pageUrl = url + '/' + i
        // console.log('正在请求：', pageUrl);
        const data = await request.get(pageUrl)
        const _$ = cheerio.load(data.text)
        // 获取图片的真实地址
        const imgUrl = _$('#content img').attr('src')
        download(seriesName, dir, imgUrl, dirChildName, pageCount)
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
}

// async 表示这是一个async函数，await只能用在这个函数里面。即 await只能在async函数中运行
// await 表示在这里等待promise返回结果了，再继续执行。
// await 后面跟着的应该是一个promise对象（当然，其他返回值也没关系，只是会立即执行，不过那样就没有意义了…）

// sleep函数
function sleep(time) {
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            // 这里会返回'ok'
            resolve('ok');
        }, time)
    })
};


// 取到所有标签对象
async function getAllTag(addr) {
    const res = await request.get(addr)
    const $ = cheerio.load(res.text)

    const ele = $('.tag ul li');

    console.log(ele.length);

    const tagObj = {};

    var $aEle = '';
    var href = '';
    var tag = '';
    var name = '';

    ele.each(function(i, elem) {
        $aEle = $(this).find('a');
        href = $aEle.attr('href');

        tag = href.split('tag/')[1];
        name = $aEle.text();

        tagObj[tag] = name;
    })

    return tagObj;
}

// 取得的对象示例
// tagObj = {
//     'ailin': "琳琳"
//     'angle': "小甜"
// }



async function getSeriesImg(url, seriesName) {
    const urls = await getUrl(url);
    for (const addr of urls) {
        await getPic(addr, seriesName)
    }
}


var baseURL = 'http://www.mmjpg.com/tag';

// 拼接成的url示例
// let url = baseURL + '/' + key + '/'
// let url = 'http://www.mmjpg.com/tag/meitui/'

var seriesName = '';

async function init() {
    var tagObj = await getAllTag('http://www.mmjpg.com/more/');

    var keys = Object.keys(tagObj);
    var len = keys.length;

    var key = '';
    var url = '';

    for (var i = 0; i < 100; i++) {
        key = keys[rand(0, len - 1)];
        url = baseURL + '/' + key + '/';
        seriesName = tagObj[key];
        console.log(`正在下载${seriesName}套图：${url}`);
        await getSeriesImg(url, seriesName);
    }
}

init();



/**
 * 生成[n, m]随机数
 * @param {number} min 
 * @param {number} max 
 */
function random(min, max) {
    return Math.random() * (max - min) + min;
}

function rand(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}