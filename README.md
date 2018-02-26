# node爬虫：送你一大波美腿图

今天小年，祭灶、迎春、大扫除迎新春。我也来送福利啦！

<!-- ![](https://user-gold-cdn.xitu.io/2018/2/8/16175ba45c378086?w=690&h=474&f=jpeg&s=52451) -->

然而这个公众号不像别的公众号那么豪气送不起书😅，就决定送大家一套美图。但是授之以鱼不如授之以渔，我们就来使用node实现个小爬虫去爬取各种美女

来吧，我们先来看看今天的目标: mmjpg.com的美腿频道下的图片


![](https://user-gold-cdn.xitu.io/2018/2/8/16175beabb0b35b2)



在开始之前先来科普科普

> 美腿是形容女性美丽、性感、修长的腿形美。美腿可以分为白璧无瑕的大腿美、晶莹剔透的小腿美、细微的美足、健康明朗的腿形美。所谓腿健美，是指腿部的线条美。腿的长短与肥瘦是决定腿部美丑的两大因素。

## 一、实现步骤

1. 确定目标页面
2. 使用superagent库来获取页面
3. 分析页面结构，使用cheerio 获取有效信息
4. 保存图片到本地
5. 开撸
6. 不断优化


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

/* console
$ node app.js
大美女尹菲开档网袜写真令人眼花缭乱 http://www.mmjpg.com/mm/1230
宅男女神丰满诱人的胴体令人想入非非 http://www.mmjpg.com/mm/1164
性感美女浴室写真高耸的酥胸诱惑十足 http://www.mmjpg.com/mm/1162
长相清纯甜美的97年妹子苗条美腿图片 http://www.mmjpg.com/mm/1157
丽质美女柔美修长美腿带给你曼妙感受 http://www.mmjpg.com/mm/1153
容貌似杨幂的美女馨怡美腿极致诱惑图 http://www.mmjpg.com/mm/1148
丝袜美腿诱惑!甜美女神杨晨晨私房套图 http://www.mmjpg.com/mm/1130
性感美女刘钰儿透视内衣私密照真撩人 http://www.mmjpg.com/mm/1127
肤白貌美的模特李晨晨十分惹人怜爱 http://www.mmjpg.com/mm/1126
萌妹林美惠子穿黑丝浴室私房写真福利 http://www.mmjpg.com/mm/1124
美女赵小米修长双腿丝袜写真能玩几年 http://www.mmjpg.com/mm/1111
*/
```

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

<!-- **一大波美女来袭** -->



<!-- **前方高能** -->





<!-- ![](https://user-gold-cdn.xitu.io/2018/2/8/16175bfd76ce80a5?w=800&h=1200&f=jpeg&s=73509) -->


<!-- ![](https://user-gold-cdn.xitu.io/2018/2/8/16175c005757de7a?w=800&h=1200&f=jpeg&s=78307) -->


<!-- ![](https://user-gold-cdn.xitu.io/2018/2/8/16175c030e3a04be?w=800&h=1150&f=jpeg&s=160769) -->



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