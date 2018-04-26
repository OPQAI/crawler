# node爬虫：送你一大波美图

来吧，我们先来看看今天的目标: mmjpg.com的各个频道下的图片


## 一、实现步骤

1. 确定目标页面
2. 使用superagent库来获取页面
3. 分析页面结构，使用cheerio 获取有效信息
4. 保存图片到本地
5. 不断优化


## 二、开始编写爬取妹子图的爬虫


下载这个小项目需要使用的库

```bash
npm i superagent cheerio fs-extra --save
```

这儿我们用到了`superagent` ` cheerio` `fs-extra`这三个库

- superagent 是nodejs里一个非常方便的客户端请求代理模块
- cheerio：为服务器特别定制的，快速、灵活、实施的jQuery核心实现
- fs-extra： 丰富了fs模块，同时支持async/await

### 2.1 请求URL获取HTML

使用superagent发起请求并打印出页面内容

```javascript
const request = require('superagent')
const cheerio = require('cheerio')
const fs = require('fs-extra')

let url = 'http://www.mmjpg.com/tag/meitui/'

request
  .get(url + '1')
  .then(function (res) {
    console.log(res.text)
  })

// 你就可以看见HTML内容打印到了控制台
```

### 2.2 分析页面结构

现在我们就需要分析页面结构，然后使用cheerio来操作了，你没用过cheerio不要紧它的语法和jQuery基本一样。作为前端，在开发者工具中分析页面应该是家常便饭，手到擒来。这儿就不多说了，记住我们的目标是找出需要的节点获取到有效信息就好


![](https://user-gold-cdn.xitu.io/2018/2/8/16175bf06f467184?w=2560&h=1600&f=png&s=362292)

我们可以发现需要的东西都在`class`为pic那个`div`下的列表中，现在我们就可以使用cheerio来获取

```javascript
...
async function getUrl() {
    const res = await request.get(url + 1)
    const $ = cheerio.load(res.text)
    $('.pic li').each(function(i, elem) {
        const href = $(this).find('a').attr('href')
        const title = $(this).find('.title').text()
        console.log(title, href)
    })
}

getUrl()


### 2.3 分析URL地址

在很多时候我们都需要分析URL，就像点击不同的页码观察URL变化 http://www.mmjpg.com/tag/meitui/2，我们可以很容易发现页码对应为URL最后的数字。查看mmjpg.com的美腿频道我们可以发现它一共有10页内容，我们就不写代码判断页数了直接写死为10。当然了这儿你可以自己实现动态判断总页数，就当是留的小练习吧。

```javascript
async function getUrl() {
  let linkArr = []
  for (let i = 1; i <= 10; i++) {
    const res = await request.get(url + i)
    const $ = cheerio.load(res.text)
    $('.pic li').each(function (i, elem) {
      let link = $(this).find('a').attr('href')
      linkArr.push(link)
    })
  }
  return linkArr
}
```

### 2.4 获取图片地址

现在我们已经能获取到图集的URL了。在上一步我们获取图集URL的时候是把页码写死了的，这是因为那个页码不是动态的，然而每个图集的图片页数是不一样的，这儿我们就需要动态判断了。进入图集后，切换图片的页码URL也会跟着变，现在这个URL就是每张图片页面的URL。我们只需要获取最后一个页面的页码， 从 1 开始历遍，和我们上面获取的URL拼接在一起就是每张图片的页面地址啦！


![](https://user-gold-cdn.xitu.io/2018/2/8/16175bf48a55b880?w=2560&h=1600&f=png&s=400521)

获取到单个图片URL后，我们可以通过图片的`src`属性去拿到真实的图片地址，然后实现下载保存

```javascript
async function getPic(url) {
  const res = await request.get(url)
  const $ = cheerio.load(res.text)
  // 以图集名称来分目录
  const dir = $('.article h2').text()
  console.log(`创建${title}文件夹`)
  await fs.mkdir(path.join(__dirname, '/mm', title))
  const pageCount = parseInt($('#page .ch.all').prev().text())
  for (let i = 1; i <= pageCount; i++) {
    let pageUrl = url + '/' + i
    const data = await request.get(pageUrl)
    const _$ = cheerio.load(data.text)
    // 获取图片的真实地址
    const imgUrl = _$('#content img').attr('src')
    download(dir, imgUrl) // TODO
  }
}
```

### 2.5 保存图片到本地

现在我们就来实现下载保存图片的方法，这儿我们使用了`stream`(流) 来保存图片

```javascript
function download(dir, imgUrl) {
  console.log(`正在下载${imgUrl}`)
  const filename = imgUrl.split('/').pop()  
  const req = request.get(imgUrl)
    .set({ 'Referer': 'http://www.mmjpg.com' }) // mmjpg.com根据Referer来限制访问
  req.pipe(fs.createWriteStream(path.join(__dirname, 'mm', dir, filename)))
}
```

ok，现在我们就来把之前写的各个功能的函数连起来

```javascript
async function init(){
  let urls = await getUrl()
  for (let url of urls) {
    await getPic(url)
  }
}

init()
```

运行该文件，你就可以看终端打印出入下信息，你的文件夹中也多了好多美女图哟！开不开心？嗨不嗨皮？


![](https://user-gold-cdn.xitu.io/2018/2/8/16175bf883f32d93?w=2560&h=1600&f=png&s=227469)



到此这个小爬虫就算写完了，但是这只是一个很简陋的爬虫，还有很多需要改进的地方

你还可以加入很多东西让它更健壮,如：

- 使用多个userAgent
- 不断更换代理ip
- 降低爬虫的速度，加个`sleep()`
- ……

*如何让它更健壮、如何应对反爬虫策略这些留着以后再讲吧*



## 三、参考链接

- superagent： http://visionmedia.github.io/superagent/
- cheerio：https://github.com/cheeriojs/cheerio
- fs-extra：https://github.com/jprichardson/node-fs-extra




**左手代码右手砖，抛砖引玉**

---
来更新了


在上面我们只能获取到一个标签所代表的一系列图

我们可以想个办法去获取到所有标签对应的一系列图集


http://www.mmjpg.com/more/

在这个里面总共有337个标签，每个标签大概有1~464套图，我们分别为不同标签创建文件夹，并将对应图集下载下来

```javascript
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

```

根据系列名来下载对应的一套图集

```javascript
async function getSeriesImg(url, seriesName) {
    let urls = await getUrl(url);
    for (let address of urls) {
        await getPic(address, seriesName)
    }
}
```

现在我们一个个遍历标签对象

```javascript

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

```

取到标签页当中的一系列图集

```javascript

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

//检测文件或者文件夹存在
function fsExistsSync(path) {
    try {
        fs.accessSync(path, fs.F_OK);
    } catch (e) {
        return false;
    }
    return true;
}

```

遍历图集中的所有图片

```javascript
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
```

将图片下载下来

```javascript
// 下载图片
function download(seriesName, dir, imgUrl, dirChildName, pageCount) {
    console.log(`正在下载${imgUrl}，共${pageCount}张图片`)
    const filename = imgUrl.split('/').pop()
    const req = request.get(imgUrl)
        .set({ 'Referer': 'http://www.mmjpg.com' })
    req.pipe(fs.createWriteStream(path.join(__dirname, 'mm', seriesName, dir, filename)))
    // req.pipe(fs.createWriteStream(path.join(dirChildName, filename)))
}
```

到这一步，所有的图片集就都下载完成啦

如果你有安装forever的话，运行以下命令即可持续获取所有图集

```bash
forever app.js
```

如果你有安装pm2的话，你可以运行这个：
```bash
pm2 start app.js -i 3 # 开启三个进程
pm2 start app.js -i max # 根据机器CPU核数，开启对应数目的进程
```