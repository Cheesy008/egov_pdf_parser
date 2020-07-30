const puppeteer = require("puppeteer");
const fetch = require("node-fetch");
const fs = require("fs");
const FormData = require("form-data");

const LOGIN_URL = 'https://idp.egov.kz/idp/sign-in';
const PDF_URL = 'https://egov.kz/services/P30.01/#/declaration/0/,/';
const CAPTCHA_SOLVER_URL = 'http://0.0.0.0:4000/egov-captcha-solver/';
const SEND_EDS_URL = 'https://egov.kz/services/P30.01/rest/app/send-eds?captchaCode='
const NCA_NODE_URL = 'http://127.0.0.1:14579'


const egov = {
    browser: null,
    page: null,
    captcha: null,

    initialize: async () => {
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null
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
            path: './captcha.jpg',
            omitBackground: true,
        });
    },

    decryptCaptcha: async () => {
        const file = fs.ReadStream('./captcha.jpg');

        const formData = new FormData();
        formData.append('file', file)

        return await fetch(CAPTCHA_SOLVER_URL, {
                'method': 'POST',
                body: formData
            }).then(resp => resp.json())
            .then(data => data.message)
    },

    passCaptcha: async (egovBin) => {
        await this.page.goto(PDF_URL, {
            waitUntil: 'networkidle2',
            timeout: 0
        });

        await this.page.type('input[class="input-type kb_small ng-scope ng-valid monospace ng-pristine"]', egovBin);

        await this.page.waitFor(5000);

        const captchaEl = await this.page.$('img[id="captcha_picture"]');
        await egov.downloadCaptcha(captchaEl);

        this.captcha = await egov.decryptCaptcha();
        await this.page.type('input[id="input_captcha"]', this.captcha);

        await this.page.$eval('button[id="searchSignButton"]', el => el.click());

    },

    sendCertificate: async (egovBin, p12) => {

        // await this.page.waitFor(5000);

        const xml_data = await this.page.evaluate(async ({
            egovBin
        }) => {
            console.log('started');
            const url = "https://egov.kz/services/P30.01/rest/app/xml";
            return await fetch(url, {
                    'method': 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        "declarantUin": egovBin,
                        "bin": egovBin
                    })
                }).then(resp => resp.json())
                .then(data => data.xml)
                .catch(err => {
                    console.log(err);
                });
        }, {
            egovBin
        });

        const signed_xml = await fetch(NCA_NODE_URL, {
                'method': 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "version": "1.0",
                    "method": "XML.sign",
                    "params": {
                        "p12": p12,
                        "password": "1234aa",
                        "xml": xml_data
                    }
                })
            }).then(resp => resp.json())
            .then(data => data['result']['xml'])
            .catch(err => {
                console.log(err);
            })

        const url = SEND_EDS_URL + this.captcha;
        
        const requestNumber = await this.page.evaluate(async ({url, signed_xml}) => {
            return await fetch(url, {
                'method': 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({'xml': signed_xml})
            }).then(resp => resp.json())
            .then(data => data['requestNumber'])
            .catch(err => {
                console.log(err);
            })
        }, {url, signed_xml})

        console.log(requestNumber);

        await this.page.waitFor(5000);

        const downloadPdfUrl = await this.page.evaluate(async ({requestNumber}) => {
            const url = "https://egov.kz/services/P30.01/rest/request-states/" + requestNumber;
            return await fetch(url)
            .then(resp => resp.json())
            .then(data => data["resultsForDownload"][1]["url"])
            .catch(err => {
                console.log(err);
            })
        }, {requestNumber});

        console.log(downloadPdfUrl);
        await this.page.goto(downloadPdfUrl)
    }

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