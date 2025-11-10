const getForgotPasswordTemplate = (data) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
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
                background-color: #e74c3c;
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
            .button {
                display: inline-block;
                padding: 12px 24px;
                background-color: #e74c3c;
                color: #ffffff;
                text-decoration: none;
                border-radius: 4px;
                margin: 20px 0;
            }
            .warning {
                background-color: #fff3cd;
                border: 1px solid #ffeeba;
                color: #856404;
                padding: 15px;
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
                <h1>Reset Your Password</h1>
            </div>
            <div class="content">
                <p>Hello,</p>
                <p>We received a request to reset your password. Click the button below to create a new password:</p>
                <center>
                    <a href="${data}" class="button">Reset Password</a>
                </center>
                <div class="warning">
                    <p><strong>Important:</strong> This link will expire in 1 hour for security reasons.</p>
                </div>
                <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
                <p>For security reasons, this link can only be used once.</p>
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

export { getForgotPasswordTemplate };
