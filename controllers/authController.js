const User = require('../models/User');
const bcrypt = require('bcrypt');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { sendEmail } = require('../services/emailService');
const crypto = require('crypto');
const BlacklistedToken = require('../models/BlacklistedToken');


exports.register = async (req, res) => {
    try {
        const { name, email, phone, password, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email or phone already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits

        const user = await User.create({
            name,
            email,
            phone,
            password: hashedPassword,
            verificationCode,
            role: role || 'user',
            passwordHistory: [{ password: hashedPassword }]
        });

        const verifyUrl = `${process.env.BACKEND_RUL}/verify-email?email=${email}&code=${user.verificationCode}`;

        try {
            await sendEmail({
                to: email,
                subject: 'Verify your email',
                template: 'register',
                data: {
                    name: user.name,
                    code: verificationCode,
                    verifyUrl
                },
            });
        } catch (err) {
            console.log(`Email not sent for user ${email}:`, err.message);
        }

        res.status(201).json({ message: 'User registered. Please verify your email.' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, phone, password } = req.body;
        const user = await User.findOne(email ? { email } : { phone });

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        if (user.isLocked) {
            const remainingTime = Math.ceil((user.lockUntil - Date.now()) / (60 * 60 * 1000));
            return res.status(401).json({
                status: 'error',
                message: `Your account is locked for ${remainingTime} more hours due to too many failed login attempts. Please try again later or contact support.`
            });
        }

        if (!user.isVerified) {
            return res.status(400).json({ message: 'Email not verified' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            await user.incrementLoginAttempts();
            const attemptsLeft = 5 - (user.loginAttempts + 1);
            return res.status(400).json({
                status: 'error',
                message: `Invalid credentials. ${attemptsLeft} attempts remaining before account is locked for 24 hours.`
            });
        }

        await user.resetLoginAttempts();
        const token = generateToken({ id: user._id });
        const refreshToken = generateRefreshToken({ id: user._id });
        user.refreshToken = refreshToken;
        await user.save();

        //Set HTTP - only cookies
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 minutes (adjust as needed)
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days (adjust as needed)
        });

        res.json({
            status: 'success',
            data: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error logging in',
            error: error.message
        });
    }
};

exports.verifyEmail = async (req, res) => {
    const { code, email } = req.query;
    const user = await User.findOne({ email, verificationCode: code });
    if (!user) return res.status(400).json({ message: 'Invalid code or email' });
    user.isVerified = true;
    user.verificationCode = undefined;
    await user.save();

    // Send email verified notification
    try {
        await sendEmail({
            to: user.email,
            subject: 'Your email has been verified!',
            template: 'emailVerified',
            data: { name: user.name }
        });
    } catch (err) {
        console.log(`Email verified notification not sent for user ${user.email}:`, err.message);
    }

    res.json({ message: 'Email verified successfully' });
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    try {
        await sendEmail({
            to: email,
            subject: 'Reset your password',
            template: 'forgotPassword',
            data: resetUrl,
        });
    } catch (err) {
        console.log(`Password reset email not sent for user ${email}:`, err.message);
    }
    res.json({ message: 'Password reset email sent' });
};

exports.resetPassword = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(400).json({ message: 'No token provided' });

        const token = authHeader.split(' ')[1];
        const { password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Check if password was used before
        const wasUsedBefore = await user.isPasswordUsedBefore(password);
        if (wasUsedBefore) {
            return res.status(400).json({
                message: 'This password was used before. Please choose a different password.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.passwordUpdateTimestamp = Date.now();

        // Add to password history
        await user.addPasswordToHistory(password);
        await user.save();

        // Add the reset token to the blacklist
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour
        await BlacklistedToken.create({ token, expiresAt });

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ message: 'Error resetting password', error: error.message });
    }
};

exports.logout = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                status: 'error',
                message: 'Authorization token required'
            });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid authorization format'
            });
        }

        // Blacklist the current token
        const expiresAt = new Date(Date.now() + (parseInt(process.env.JWT_EXPIRES_IN) || 15) * 60 * 1000);
        await BlacklistedToken.create({ token, expiresAt });

        // Clear cookies
        res.clearCookie('token');
        res.clearCookie('refreshToken');

        res.json({
            status: 'success',
            message: 'Logged out successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error during logout',
            error: error.message
        });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        // Accept refreshToken from cookies or request body
        const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({
                status: 'error',
                message: 'No refresh token provided'
            });
        }

        // Check if refresh token is blacklisted
        const blacklisted = await BlacklistedToken.findOne({ token: refreshToken });
        if (blacklisted) {
            return res.status(401).json({
                status: 'error',
                message: 'Refresh token has been invalidated'
            });
        }

        let payload;
        try {
            payload = verifyRefreshToken(refreshToken);
        } catch (err) {
            // Clear cookies if refresh token is expired
            res.clearCookie('token');
            res.clearCookie('refreshToken');

            return res.status(401).json({
                status: 'error',
                message: 'Session expired. Please login again.'
            });
        }

        const user = await User.findById(payload.id);
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid refresh token'
            });
        }

        // Generate new tokens
        const newToken = generateToken({ id: user._id });
        const newRefreshToken = generateRefreshToken({ id: user._id });

        // Update user's refresh token
        user.refreshToken = newRefreshToken;
        await user.save();

        // Set new cookies
        res.cookie('token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            status: 'success',
            message: 'Token refreshed successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error refreshing token',
            error: error.message
        });
    }
};


exports.getProfile = async (req, res) => {
    try {
        // req.user is set by verifyToken middleware
        if (!req.user) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }
        res.json({
            status: 'success',
            data: {
                name: req.user.name,
                email: req.user.email,
                phone: req.user.phone,
                role: req.user.role,
                createdAt: req.user.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Error fetching profile', error: error.message });
    }
};


