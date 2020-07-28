const egov = require('./egov');
require('dotenv').config();

const egovBin = process.env.EGOV_BIN;
const egovPassword = process.env.EGOV_PASSWORD;

(async () => {

    await egov.initialize();

    await egov.login(egovBin, egovPassword);

    await egov.getPdf(egovBin);

})();

// const puppeteer = require("puppeteer");
// const fs = require("fs");


// (async () => {
//     browser = await puppeteer.launch({
//         headless: false
//     });

//     page = await browser.newPage();

//     await page.goto('https://idp.egov.kz/idp/sign-in', {waitUntil: 'networkidle2'});

//     await page.evaluate(({
//         egovBin,
//         egovPassword
//     }) => {
//         const binInput = document.querySelector('input[class="field__input a-field__input inputiin"]');
//         binInput.value = egovBin;

//         const passwordInput = document.querySelector('input[class="field__input a-field__input inputpass"]');
//         passwordInput.value = egovPassword;

//         const button = document.querySelector('input[class="btn btn-primary btn-fit mt-3"]');
//         button.click();

//     }, {
//         egovBin,
//         egovPassword
//     });

//     await page.waitForNavigation();

//     // const viewSource = await page.goto('https://intoli.com/blog/saving-images/img/logo.svg');


//     fs.writeFile("./anu.jpg", await viewSource.buffer(), function (err) {
//         if (err) {
//             return console.log(err);
//         }


//         console.log("The file was saved!");
//     })

// })();

// const fetch = require("node-fetch");
// const FormData = require("form-data");
// const fs = require("fs");

// const capthaSolverUrl = 'http://0.0.0.0:4000/egov-captcha-solver/';


// const file = fs.ReadStream('/home/cheesy008/javascript_devs/egov/captcha_images/captcha.jpeg');

// const formData = new FormData();
// formData.append('file', file)

// const upload = async (file) => {
//     return await fetch('http://0.0.0.0:4000/egov-captcha-solver/', { 
//       method: 'POST',
//       body: file 
//     }).then(response => response.json())
//       .then(data => data.message)
//   };

// //   upload(formData)

// (async function() {
//     const a = await upload(formData);
//     console.log(a);
//   })();