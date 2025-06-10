require('dotenv').config();

const emailConfig = {
    sendgrid: {
        apiKey: process.env.SENDGRID_API_KEY,
        from: {
            email: process.env.SENDGRID_FROM_EMAIL,
            name: process.env.SENDGRID_FROM_NAME || 'Your Company'
        }
    },
    verification: {
        codeExpiry: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
        resetPasswordExpiry: 60 * 60 * 1000 // 1 hour in milliseconds
    }
};

module.exports = emailConfig; 