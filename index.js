const egov = require('./egov');
require('dotenv').config();

const egovBin = process.env.EGOV_BIN;
const egovPassword = process.env.EGOV_PASSWORD;

(async () => {

    await egov.initialize();

    await egov.login(egovBin, egovPassword);

    await egov.passCaptcha(egovBin);

    await egov.sendCertificate();

})();
