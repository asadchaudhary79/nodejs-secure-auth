const { getRegisterTemplate } = require('./register');
const { getForgotPasswordTemplate } = require('./forgotPassword');
const { getVerifyEmailTemplate } = require('./emailVerified');

module.exports = {
    getRegisterTemplate,
    getForgotPasswordTemplate,
    getVerifyEmailTemplate,
}; 