// const puppeteer = require('puppeteer');
// require('dotenv').config();

// const loginUrl = 'https://idp.egov.kz/idp/sign-in?lang=ru';
// const pdfUrl = 'https://egov.kz/services/P30.01/#/declaration/0/,/';

// const username_env = process.env.USERNAME;
// const password_env = process.env.PASSWORD;


// (async () => {
//     const browser = await puppeteer.launch({
//         headless: false
//     });

//     try {

//         const page = await browser.newPage();

//         await page.goto(loginUrl);
//         await page.waitForSelector('form');

//         await page.evaluate(({
//             username_env,
//             password_env
//         }) => {
//             const username = document.querySelector('input[class="field__input a-field__input inputiin"]');
//             username.value = username_env;

//             const password = document.querySelector('input[class="field__input a-field__input inputpass"]');
//             password.value = password_env;

//             const button = document.querySelector('input[class="btn btn-primary btn-fit mt-3"]');
//             button.click();

//         }, {
//             username_env,
//             password_env
//         });

//         await page.waitForNavigation();

//         await page.goto(pdfUrl);

        
//         await page.evaluate(async () => {
//             let flag = true;

//             while(flag) {
//                 await new Promise(r => setTimeout(r, 2000));
//                 const someTag = document.querySelector('button[id="searchSignButton"]');
//                 if (someTag != null) {
//                     console.log('not null');
//                 }
//             }
//         })

//     } catch (error) {
//         console.log(error)

//     } finally {

//     }

// })();




const egov = require('./egov');
require('dotenv').config();

const username = process.env.USERNAME;
const password = process.env.PASSWORD;

(async () => {

    await egov.initialize();

    await egov.login(username, password);

    await egov.getPdf();

})();