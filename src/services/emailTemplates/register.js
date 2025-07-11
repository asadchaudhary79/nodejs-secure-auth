const getRegisterTemplate = (data) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Our Platform</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                padding: 20px;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                padding: 20px 0;
                background-color: #4a90e2;
                border-radius: 8px 8px 0 0;
            }
            .header h1 {
                color: #ffffff;
                margin: 0;
                font-size: 24px;
            }
            .content {
                padding: 30px 20px;
            }
            .verification-code {
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 4px;
                text-align: center;
                margin: 20px 0;
                font-size: 24px;
                font-weight: bold;
                color: #4a90e2;
            }
            .button {
                display: inline-block;
                padding: 12px 24px;
                background-color: #4a90e2;
                color: #ffffff;
                text-decoration: none;
                border-radius: 4px;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                padding: 20px;
                color: #666666;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to Our Platform!</h1>
            </div>
            <div class="content">
                <p>Hello ${data.name},</p>
                <p>Thank you for registering with us! We're excited to have you on board.</p>
                <p>To complete your registration, please use the following verification code:</p>
                <div class="verification-code">
                    ${data.code}
                </div>
                <p>This verification code will expire in 24 hours.</p>
                <p>If you didn't create an account, please ignore this email.</p>
            </div>
            <div class="footer">
                <p>This is an automated email, please do not reply.</p>
                <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

module.exports = { getRegisterTemplate }; 