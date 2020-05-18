const puppeteer = require('puppeteer');

// (async ()=>{
//     let http = 'https://github.com/GoogleChrome/puppeteer';
//     let screenshotImgName = http.replace(/\D*/g,"");
//     if(typeof screenshotImgName !== 'number' ){
//         screenshotImgName = http.slice(-1);
//     }
//     console.log(screenshotImgName);
//     const browser = await puppeteer.launch();
//     const page = await browser.newPage();
//     await page.goto(http);
//     await page.screenshot({path:`./screenshotImg/${screenshotImgName}.png`});
//     await browser.close();
// })();


function sleep(delay){
    return new Promise((resolve,reject)=>{
        setTimeout(()=>{
            try{
                resolve(1)
            }catch (err) {
                reject(0)
            }
        },delay)
    })
}


//打开京东，手机，详情页，截屏；
// puppeteer.launch({
//     ignoreHTTPSErrors:true,
//     headless:false,
//     slowMo:250,
//     timeout:0
// }).then(async browser =>{
//     let page = await browser.newPage();
//     await page.setJavaScriptEnabled(true);
//     await page.goto('https://www.jd.com/');
//     const searchInput = await page.$("#key");
//     await searchInput.focus(); // 定位到搜索框
//     await page.keyboard.type('手机');
//     const searchBtn = await page.$('.button');
//     await searchBtn.click();
//     await page.waitForSelector('.gl-item'); //等待元素加载之后，否则获取不到异步加载的元素
//     const links = await page.$$eval('.gl-item > .gl-i-wrap > .p-img > a',links => {
//         return links.map(a => {
//             return {
//                 href:a.href.trim(),
//                 title:a.title
//             }
//         });
//     });
//     page.close();

//     const aTags = links.splice(0,10);
//     console.log('aTags',aTags);
//     for(var i = 1;i<aTags.length;i++){
//         page = await browser.newPage();
//         page.setJavaScriptEnabled(true);
//         await page.setViewport({width:1920,height:1080});
//         var a = aTags[i];
//         await page.goto(a.href,{timeout:0});  // 防止页面太长，加载超时

//         //    注入代码，慢慢把滚动条滑到最底部，保证所有的元素被全部加载
//         let scrollEnable = true;
//         let scrollStep = 500; //每次滚动的步长
//         // while (scrollEnable){
//         //     scrollEnable = await page.evaluate((scrollStep)=>{
//         //         let scrollTop = document.scrollingElement.scrollTop;
//         //         document.scrollingElement.scrollTop = scrollTop + scrollStep;
//         //         return document.body.clientHeight >scrollTop + 1080 ? true:false
//         //     },scrollStep);
//         //     await sleep(100);
//         // }
//         console.log('75：到这里了吗？')
//         // await page.waitForSelector('#copyright_year',{timeout:0}); // 判断是否到达底部了
//         let filename = "images/items-" + i + ".png";
//         // 这里有个Puppeteer的bug一直没有解决，发现截图的高度最大也只能是16384px，超出部分被截掉了。
//         console.log('filename:',filename);
//         await page.screenshot({path:filename,fullPage:true});
//         page.close();
//     }

//     browser.close()
// });



//爬取腾讯电影的数据
const chalk = require('chalk');
const fs = require('fs');

// 延迟执行
const sleep = time => new Promise(resolve => {
    setTimeout(resolve, time);
});

// console.log 简写
const log = console.log;
// 要爬取的网页数量
const TOTAL_PAGE = 5;

// 爬取的链接
// const url = `https://v.qq.com/x/list/movie?itype=-1&offset=0`;
const url = `https://v.qq.com/channel/movie?listpage=1&channel=movie&itype=100062`;

// 格式化进度输出
function formatProgress(current) {
    let percent = (current / TOTAL_PAGE) * 100;
    let done = ~~(current / TOTAL_PAGE * 40);
    let left = 40 - done;
    let str = `当前进度：[${''.padStart(done, '=')}${''.padStart(left, '-')}]  ${percent}%`;
    return str;
}

(async () => {
    // 启动浏览器环境
    const browser = await puppeteer.launch({
        // headless: false,
        // slowMo: 250,
        ignoreHTTPSErrors:true,
        headless:false,
        slowMo:250,
        timeout:0
    });
    const page = await browser.newPage(); // 打开一个新的页面
    await page.setViewport({width:1535,height:756}); //设置浏览器窗口大小
    log(chalk.green('服务正常启动'))
    await page.setJavaScriptEnabled(true);
    // await page.goto(url);
    try {
        // 监听内部的console消息
        page.on('console', message => {
            if (typeof message == 'object') {
                console.dir(message);
            } else {
                log(chalk.blue(message))
            }
        });

        // 打开要爬取的链接
        await page.goto(url, {
            waitUntil: 'networkidle2' // 网络空闲说明已加载完毕
        });

        log(chalk.yellow('页面初次加载完毕'));
        await sleep(3000);
        for (let i = 1; i <= TOTAL_PAGE; i++) {
            // const submit = await page.$('.page_next'); // 获取下一页按钮
            // if (!submit) {
            //     chalk.red('数据获取完毕');
            //     return;
            // }
            // await submit.click(); // 模拟点击跳转下一页
            await sleep(3000);
            await page.waitFor(2500); // 等待页面加载完毕
            console.clear();
            // 打印当前的爬取进度
            log(chalk.yellow(formatProgress(i)));
            log(chalk.yellow('页面数据加载完毕'));

            await handleData(); // 执行方法
            await sleep(3000);
            await page.waitFor(2500); // 一个页面爬取完毕以后稍微歇歇
        }

        await browser.close();
        log(chalk.green('服务正常结束'));

        // 获取浏览器内部内容
        async function handleData() {
            const result = await page.evaluate(() => {
                var $ = window.$; // // 拿到页面上的JQuery
                var itemList = $('.list_item'); // 拿到所有的item
                var links = []; // 存储爬取的数据
                // 循环写进数组
                itemList.each((index, item) => {
                    let i = $(item);
                    let vid = i.find('.figure').data('float'); // id
                    let link = i.find('.figure').attr('href'); // 链接地址
                    let star = i.find('.figure_desc').attr('title'); // 主演
                    let title = i.find('.figure_pic').attr('alt'); // 电影名称
                    let poster = i.find('.figure_pic').attr('src'); // 封面图片
                    let count = i.find('.figure_count').text(); // 播放量
                    // 存进之前定义好的数组中
                    links.push({
                        vid,
                        title,
                        count,
                        star,
                        poster,
                        link
                    });
                });
                return links; // 返回数据
            });

            // 写入json文件中
            fs.writeFile('./movie.json', JSON.stringify(result, null, '\t', {
                'flag': 'a'
            }), function (err) {
                if (err) {
                    throw err;
                }
            });
            log(chalk.yellow('写入数据完毕'));
        }
    } catch (error) {
        console.log(error)
        log(chalk.red('服务意外终止'))
        await browser.close()
    } finally {
        process.exit(0);
    }
})();

