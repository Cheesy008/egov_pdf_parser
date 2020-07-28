const puppeteer = require("puppeteer");
const fetch = require("node-fetch");
const fs = require("fs");
const FormData = require("form-data");

const LOGIN_URL = 'https://idp.egov.kz/idp/sign-in';
const PDF_URL = 'https://egov.kz/services/P30.01/#/declaration/0/,/';
const CAPTCHA_SOLVER_URL = 'http://0.0.0.0:4000/egov-captcha-solver/';


const egov = {
    browser: null,
    page: null,

    initialize: async () => {
        this.browser = await puppeteer.launch({
            headless: false
        });

        this.page = await this.browser.newPage();
    },

    login: async (egovBin, egovPassword) => {
        await this.page.goto(LOGIN_URL, {
            waitUntil: 'networkidle2'
        });

        await this.page.evaluate(({
            egovBin,
            egovPassword
        }) => {
            const binInput = document.querySelector('input[class="field__input a-field__input inputiin"]');
            binInput.value = egovBin;

            const passwordInput = document.querySelector('input[class="field__input a-field__input inputpass"]');
            passwordInput.value = egovPassword;

            const button = document.querySelector('input[class="btn btn-primary btn-fit mt-3"]');
            button.click();

        }, {
            egovBin,
            egovPassword
        });

        await this.page.waitForNavigation();
    },

    downloadCaptcha: async (captchaImage) => {
        await captchaImage.screenshot({
            path: './captcha_images/captcha.jpg',
            omitBackground: true,
        });
    },

    decryptCaptcha: async () => {
        const file = fs.ReadStream('./captcha_images/captcha.jpg');

        const formData = new FormData();
        formData.append('file', file)

        return await fetch(CAPTCHA_SOLVER_URL, {
                'method': 'POST',
                body: formData
            }).then(resp => resp.json())
            .then(data => data.message)
    },

    getPdf: async (egovBin) => {
        await this.page.goto(PDF_URL, {
            waitUntil: 'networkidle2',
            timeout: 0
        });

        await this.page.type('input[class="input-type kb_small ng-scope ng-valid monospace ng-pristine"]', egovBin);

        await this.page.waitFor(3000);

        const captchaEl = await this.page.$('img[id="captcha_picture"]');

        await egov.downloadCaptcha(captchaEl);

        const captcha = await egov.decryptCaptcha();

        await this.page.type('input[id="input_captcha"]', captcha);

        await this.page.$eval('button[id="searchSignButton"]', el => el.click());

    },

    // getPdf: async () => {
    //     await this.page.goto(pdfUrl, {waitUntil: 'networkidle2'});
    //     await this.page.waitFor(1000);

    //     await this.page.evaluate(async () => {
    //         let flag = true;

    //         while(flag) {
    //             await new Promise(r => setTimeout(r, 2000));
    //             const someTag = document.querySelector('button[id="searchSignButton"]');
    //             if (someTag != null) {
    //                 console.log('not null');
    //             }
    //         }
    //     })
    // },

}

module.exports = egov;