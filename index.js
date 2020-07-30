const egov = require('./egov');
require('dotenv').config();

const egovBin = process.env.EGOV_BIN;
const egovPassword = process.env.EGOV_PASSWORD;
const p12 = process.env.P12;

(async () => {

    await egov.initialize();

    await egov.login(egovBin, egovPassword);

    await egov.passCaptcha(egovBin);

    await egov.getPdfUrl(egovBin, p12);
})();
