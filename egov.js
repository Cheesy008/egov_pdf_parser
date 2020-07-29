const puppeteer = require("puppeteer");
const fetch = require("node-fetch");
const fs = require("fs");
const FormData = require("form-data");
var xmlenc = require('xml-encryption');
var SignedXml = require('xml-crypto').SignedXml	 

const LOGIN_URL = 'https://idp.egov.kz/idp/sign-in';
const PDF_URL = 'https://egov.kz/services/P30.01/#/declaration/0/,/';
const CAPTCHA_SOLVER_URL = 'http://0.0.0.0:4000/egov-captcha-solver/';
const SEND_EDS_URL = 'https://egov.kz/services/P30.01/rest/app/send-eds?captchaCode='


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

    passCaptcha: async (egovBin) => {
        await this.page.goto(PDF_URL, {
            waitUntil: 'networkidle2',
            timeout: 0
        });

        await this.page.type('input[class="input-type kb_small ng-scope ng-valid monospace ng-pristine"]', egovBin);

        await this.page.waitFor(3000);

        const captchaEl = await this.page.$('img[id="captcha_picture"]');
        await egov.downloadCaptcha(captchaEl);

        this.captcha = await egov.decryptCaptcha();
        await this.page.type('input[id="input_captcha"]', this.captcha);

        await this.page.$eval('button[id="searchSignButton"]', el => el.click());

        // this.page.waitForNavigation({ waitUntil: 'networkidle2' }); 
    },

    sendCertificate: async () => {
        const btnSelector = "#sign > div > div > div > div:nth-child(2) > eds > div > div > div:nth-child(2) > figure > figcaption > a";
        await this.page.waitForSelector(btnSelector);
        await this.page.evaluate(({
            btnSelector
        }) => {
            const btn = document.querySelector(btnSelector);
            btn.click();
        }, {
            btnSelector
        })

        await this.page.waitFor(5000);

        const url = SEND_EDS_URL + this.captcha;
        // const url = "https://egov.kz/services/P30.01/rest/app/xml";


        // body = {
        //     declarantUin: "140140015980",
        //     bin: "140140015980"
        // }
        // const options = {
        //     rsa_pub: fs.readFileSync('./certificate/cert.pub'),
        //     pem: fs.readFileSync('./certificate/cert.pem'),
        //     encryptionAlgorithm: 'http://www.w3.org/2001/04/xmlenc#aes256-cbc',
        //     keyEncryptionAlgorithm: 'http://www.w3.org/2001/04/xmlenc#rsa-oaep-mgf1p',
        //     disallowEncryptionWithInsecureAlgorithm: true,
        //     warnInsecureAlgorithm: true
        // };

        // const signedXml = xmlenc.encrypt('blabla', options, (err, result) => {
        //     console.log(err, result);
        // })
        var xml = "<library>" +
	            "<book>" +
	              "<name>Harry Potter</name>" +
	            "</book>" +
              "</library>"
              
        var sig = new SignedXml()
        sig.addReference("//*[local-name(.)='book']")    
        sig.signingKey = fs.readFileSync("./certificate/GOSTKNCA.p12")
        sig.computeSignature(xml)
        fs.writeFileSync("./certificate/signed.xml", sig.getSignedXml())


        const data = fs.ReadStream('./certificate/signed.xml');

        await fetch(url, {
                'method': 'POST',
                body: data,
            }).then(resp => resp.json())
            .then(data => {
                console.log(data);
            })
            .catch(err => {
                console.log(err);
            });
        console.log('test');
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