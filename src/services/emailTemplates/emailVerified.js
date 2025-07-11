const getVerifyEmailTemplate = (data) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verified</title>
        <style>
            body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); padding: 32px; }
            .header { text-align: center; background: #4caf50; padding: 24px 0; border-radius: 8px 8px 0 0; }
            .header h1 { color: #fff; margin: 0; font-size: 26px; }
            .content { padding: 24px 0; text-align: center; }
            .content p { font-size: 18px; color: #333; }
            .footer { text-align: center; color: #888; font-size: 13px; margin-top: 32px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Email Verified!</h1>
            </div>
            <div class="content">
                <p>Hi ${data.name},</p>
                <p>Your email has been successfully verified. Thank you for confirming your email address!</p>
                <p>You can now enjoy all the features of your account.</p>
            </div>
            <div class="footer">
                &copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    `;
};

module.exports = { getVerifyEmailTemplate }; 