const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Generate a new 2FA secret
const generateTwoFactorSecret = () => {
    return speakeasy.generateSecret({
        name: 'SecureAuth',
        issuer: 'devstitch',
        length: 20
    });
};

// Generate QR code for 2FA setup
const generateQRCode = async (secret, email) => {
    try {
        const otpauthUrl = speakeasy.otpauthURL({
            secret: secret.base32,
            label: email,
            issuer: 'SecureAuth',
            encoding: 'base32',
        });

        const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl);
        return qrCodeDataURL;
    } catch (error) {
        throw new Error('Failed to generate QR code: ' + error.message);
    }
};

// Verify 2FA token
const verifyTwoFactorToken = (secret, token) => { 
    try {
        const result = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 2 // Allow 2 time steps (60 seconds) for clock skew
        });
        
        console.log('2FA Token Verification - Result:', result);
        return result;
    } catch (error) {
        console.error('2FA Token Verification - Error:', error);
        return false;
    }
};

// Generate backup codes (optional feature)
const generateBackupCodes = () => {
    const codes = [];
    for (let i = 0; i < 10; i++) {
        codes.push(speakeasy.generateSecret({ length: 10 }).base32);
    }
    return codes;
};

// Generate current TOTP token for debugging (remove in production)
const generateCurrentToken = (secret) => {
    try {
        return speakeasy.totp({
            secret: secret,
            encoding: 'base32',
            digits: 6
        });
    } catch (error) {
        console.error('Error generating current token:', error);
        return null;
    }
};

module.exports = {
    generateTwoFactorSecret,
    generateQRCode,
    verifyTwoFactorToken,
    generateBackupCodes,
    generateCurrentToken
}; 