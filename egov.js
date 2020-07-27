const puppeteer = require('puppeteer');

const loginUrl = 'https://idp.egov.kz/idp/sign-in?lang=ru';
const pdfUrl = 'https://egov.kz/services/P30.01/#/declaration/0/,/';

const egov = {
    browser: null,
    page: null,

    initialize: async () => {
        this.browser = await puppeteer.launch({
            headless: false
        });

        this.page = await this.browser.newPage();
    },

    login: async (username, password) => {
        await this.page.goto(loginUrl, {waitUntil: 'networkidle2'});
        await this.page.waitFor(1000);

        await this.page.evaluate(({username, password}) => {
            const u = document.querySelector('input[class="field__input a-field__input inputiin"]');
            u.value = username;

            const p = document.querySelector('input[class="field__input a-field__input inputpass"]');
            p.value = password;

            const button = document.querySelector('input[class="btn btn-primary btn-fit mt-3"]');
            button.click();

        }, {username, password});

        await this.page.waitForNavigation();
    },

    getPdf: async () => {
        await this.page.goto(pdfUrl, {waitUntil: 'networkidle2'});
        await this.page.waitFor(1000);

        await this.page.evaluate(async () => {
            let flag = true;

            while(flag) {
                await new Promise(r => setTimeout(r, 2000));
                const someTag = document.querySelector('button[id="searchSignButton"]');
                if (someTag != null) {
                    console.log('not null');
                }
            }
        })
    },

}

module.exports = egov;