const sgMail = require('@sendgrid/mail');
const { getRegisterTemplate, getForgotPasswordTemplate, getVerifyEmailTemplate } = require('./emailTemplates');
const emailConfig = require('../config/emailConfig');

// Initialize SendGrid with API key
sgMail.setApiKey(emailConfig.sendgrid.apiKey);

const sendEmail = async ({ to, subject, template, data }) => {
    try {
        let html;

        // Select template based on type
        switch (template) {
            case 'register':
                html = getRegisterTemplate(data);
                subject = 'Welcome to Our Platform'
                break;
            case 'forgotPassword':
                html = getForgotPasswordTemplate(data);
                subject = 'Reset Your Password'
                break;
            case 'verifyEmail':
                html = getVerifyEmailTemplate(data);
                subject = 'Verify Your Email'
                break;
            default:
                throw new Error('Invalid template type');
        }

        // Prepare email message
        const msg = {
            to,
            from: {
                email: emailConfig.sendgrid.from.email,
                name: emailConfig.sendgrid.from.name
            },
            subject,
            html
        };

        // Send email using SendGrid
        const response = await sgMail.send(msg);

        // Log detailed email information
        console.log('\n=== Email Sent Successfully ===');
        console.log('To:', to);
        console.log('From:', `${msg.from.name} <${msg.from.email}>`);
        console.log('Subject:', subject);
        console.log('Template:', template);
        console.log('Message ID:', response[0].headers['x-message-id']);
        console.log('Status Code:', response[0].statusCode);
        console.log('=============================\n');

        return response;
    } catch (error) {
        console.error('\n=== Email Sending Failed ===');
        console.error('To:', to);
        console.error('Subject:', subject);
        console.error('Template:', template);
        console.error('Error:', error.message);
        if (error.response) {
            console.error('SendGrid Error Details:', error.response.body);
        }
        console.error('===========================\n');
        throw error;
    }
};

module.exports = { sendEmail };