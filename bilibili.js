const puppeteer = require('puppeteer');
const chalk = require('chalk');
const fs = require('fs');

// 延迟执行
const sleep = time => new Promise(resolve => {
    setTimeout(resolve, time);
});

// console.log 简写
// const log = console.log;


// 爬取的链接
/*
* https://t.bilibili.com/ 这个哔哩哔哩的链接的登录弹出来的有iframe元素，在mouse事件中不知道如何解决
* https://passport.bilibili.com/login 这个bilibli中的没有。所以现在换成这个地址
* */
const url = `https://passport.bilibili.com/login`;
const username = '18877498494';
const passwold = '443080804a';

//登录滑块
let page = null;
let btn_position = null;
let times = 0; // 执行重新滑动的次数
let errAgainCount = 1;
const distanceError = [2,3,4,5]; //距离误差

function getRandomNumberByTange(start,end){
    return Math.floor(Math.random()* (end-start) + start);
}
let count = 0;

async function run(){
    // 启动浏览器环境
    const browser = await puppeteer.launch({
        headless:false,
        devtools:true, //开启开发者控制台
    });
    page = await browser.newPage(); // 打开一个新的页面
    await page.setViewport({width:1535,height:756}); //设置浏览器窗口大小
    log(chalk.green('服务正常启动'));
    try {
        // 监听内部的console消息
        // page.on('console', message => {
        //     if (typeof message == 'object') {
        //         console.dir(message);
        //     } else {
        //         log(chalk.blue(message))
        //     }
        // });

        // 打开要爬取的链接
        await page.goto(url, {
            waitUntil: 'networkidle2' // 网络空闲说明已加载完毕
        });
        log(chalk.yellow('页面初次加载完毕'));

        //登录
        // await page.waitFor('.login');
        // await page.click('.login');

        //要进入ifame中才可以进行操作，填写表单；
        // await page.waitFor('body>iframe');
        // let frame = (await page.frames())[1];
        await page.waitFor('#login-username');
        await page.waitFor('#login-passwd');
        await page.type('#login-username',username);
        await page.type('#login-passwd',passwold);
        log(chalk.red('填写完用户，密码'));
        // await frame.waitFor(3000);
        // await sleep(5000);
        //点击登录
        await page.waitFor('.btn-login');
        await page.click('.btn-login');

        btn_position = await getBtnPosition();
        //滑动验证
        count = getRandomNumberByTange(3,9);
        drag(null);


        // await browser.close();
        // log(chalk.green('服务正常结束'));

    } catch (error) {
        console.log(error);
        log(chalk.red('服务意外终止'))
        run();
        // await browser.close()
    } finally {
        // process.exit(0);
    }
};

/*
* 计算滑块位置
* @params
* */
async function getBtnPosition(){
    await page.waitFor('.geetest_slider_button');
    let slider = await page.waitFor('.geetest_slider_button');
    let btn_position = await slider.boundingBox()
    console.log('btn_position：',btn_position);
    return btn_position;
}

/*
* 计算按钮需要滑动的距离
* 花的时间太长了，所以导致验证失败。
* */
async function calculateDistance(){
    log(chalk.yellow('开始计算像素差'));
    await page.waitFor('.geetest_canvas_fullbg');
    await page.waitFor('.geetest_canvas_bg');
    // 先等待图片canvas出来后再计算像素差
    await sleep(2000);
    const distance = await page.evaluate(()=>{
        // 比较像素，找到缺口的大概位置
        function compare(document) {
            const ctx1 = document.querySelector('.geetest_canvas_fullbg');// 完整图片
            const ctx2 = document.querySelector('.geetest_canvas_bg'); // 带缺口图片
            const pixelDifference = 30; // 像素差
            let res = []; // 保存像素差较大的x坐标

            // 对比像素
            for (let i = 57;i<260;i++){
                for(let j=1;j<160;j++){
                    const imgData1 = ctx1.getContext('2d').getImageData(1*i,1*j,1,1);
                    const imgData2 = ctx2.getContext('2d').getImageData(1*i,1*j,1,1);
                    const data1 = imgData1.data;
                    const data2 = imgData2.data;
                    const res1 = Math.abs(data1[0]-data2[0]);
                    const res2 = Math.abs(data1[1]-data2[1]);
                    const res3 = Math.abs(data1[2]-data2[2]);
                        if(!(res1 < pixelDifference && res2 < pixelDifference && res3 < pixelDifference)){
                            if(!res.includes(i)){
                                res.push(i);
                                // console.log(res);
                            }
                        }
                }
            }
            // 返回像素差最大值跟最小值，经过调试最小值往左小7像素，最大值往左54像素
            return {min:res[0],max:res[res.length-1]};
        }
        return compare(document);
    });
    log(chalk.blue('像素差计算完毕'));
    return distance;
}

/*
* 尝试滑动按钮
* @param distance 滑动的距离， frame 获取iframe中的元素
* */
async function tryValidation(distance){
    log(chalk.green('移动的距离'+ distance));
    // 将距离拆分成两段，模拟正常人的行为
    //经过多次测试，这样得出的来的移动距离distance要比实际的大9.5，所以要减掉9.5；distance - 9.5，像素误差在11~8之间。
    //为了模拟得像人的行为，分为几段来移动。
    const distance1 = distance - 8.5; // distance1是正确的距离
    //如何让每次登陆的验证的滑动轨迹都不同

    // let count = Math.floor(Math.random() * 10) + 1;

    log(chalk.blue('count:',count));
    const distance2 = distance1/count;

    await page.mouse.move(btn_position.x ,btn_position.y);
    await page.mouse.down();
    await sleep(800);

    for(let i = 1;i<count+1;i++){
        await page.mouse.move(btn_position.x + distance2 * i,btn_position.y,{steps:30});
        await sleep(800);
    }

    page.mouse.up();
    await sleep(3000);

    // 判断是否验证成功
    const isSuccess = await page.evaluate(() => {
        return document.querySelector('.geetest_success_radar_tip_content') && document.querySelector('.geetest_success_radar_tip_content').innerHTML
    })
    await sleep(1000);
    // 判断是否需要重新计算距离
    const reDistance = await page.evaluate(() => {
        return document.querySelector('.geetest_result_content') && document.querySelector('.geetest_result_content').innerHTML
    })
    await sleep(1000);
    // return {isSuccess:isSuccess==='验证成功',reDistance:reDistance.includes('怪物吃了拼图')}
    log(chalk.red('isSuccess：'+ isSuccess))
    return {isSuccess:isSuccess,reDistance:reDistance};

}


/*
* 拖动滑块
* @param distance 滑动距离 frame 获取iframe中的元素
* */

async function drag(distance) {

    distance = distance || await calculateDistance();
    console.log('distance:',distance);
    const result = await tryValidation(distance.min);
    console.log('result',result);
    if(result.isSuccess){
        log(chalk.green('isSuccess：'+ result.isSuccess))
        await sleep(1000);
        log(chalk.green('验证成功'));
    }else if(result.reDistance == '出现错误, 请关闭验证重试'){
            log(chalk.red('出现错误, 请关闭验证重试：'+errAgainCount));
            errAgainCount++;
            await page.waitFor('.geetest_panel_error_content');
            await page.click('.geetest_panel_error_content');
            await sleep(2000);
            if(errAgainCount>7){
                errAgainCount = 1;
                run();
            }else {
                await drag(null);
            }
    }else{
        if(times<4){
            times++;
            log(chalk.white('重新滑动'+ times));
            await drag({min:distance.min,max:distance.max});
        }else{
            log(chalk.red('滑动失败'));
            times = 0;
            run();
        }
    }

}
//滑动验证码的安全性不在于难度，而是时间消耗
// 因为计算像素差用的时间太久了，执行滑块花的时间太长，所以得到的结果是‘被怪物吃掉了’，第二次就显示出来网络不当。9/18

//经过测试，不是对比像素差花的时间多，导致出现‘被怪物吃掉了’，而是可能移动的时候被识别出来使机器人。  9/19

// 现在要解决的问题是，如何让验证不知道我是个机器人？？
run();