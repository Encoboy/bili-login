const puppeteer = require('puppeteer');
// (async () => {
//         let browser = await puppeteer.launch({headless: false});
//         let page = await browser.newPage();
//         await page.setViewport({width:1535,height:756}); //设置浏览器窗口大小
//         let response = await page.goto("https://www.baidu.com/");
//         await page.waitFor(1000);
//         let element  = await page.$("#u1 > a.pf");
//         let box = await element.boundingBox();
//         const x = box.x + (box.width/2);
//         const y = box.y + (box.height/2);
//         await page.mouse.move(x,y);
//         await page.waitFor(10000);
//         await page.close();
//         await browser.close();
//     }
// )();

(async () => {
        let browser = await puppeteer.launch({headless: false});
        let page = await browser.newPage();
        // await page.setViewport({width:1535,height:756}); //设置浏览器窗口大小
        await page.goto("https://map.baidu.com/");
        await page.waitFor(1000);
        await page.mouse.move(500,400);
        await page.mouse.down();
        await page.mouse.move(100,200,{steps:1000});
        await page.mouse.up();
        await page.waitFor(10000);
        await page.close();
        await browser.close();
    }
)();