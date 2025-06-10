const jwt = require('jsonwebtoken');
const User = require('../models/User');
const BlacklistedToken = require('../models/BlacklistedToken');
const { generateToken, verifyRefreshToken } = require('../utils/jwt');

// Middleware to verify JWT token and handle refresh
exports.verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                status: 'error',
                message: 'No token provided'
            });
        }

        const token = authHeader.split(' ')[1];

        // Check if token is blacklisted
        const blacklisted = await BlacklistedToken.findOne({ token });
        if (blacklisted) {
            return res.status(401).json({
                status: 'error',
                message: 'Token has been invalidated'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return res.status(401).json({
                    status: 'error',
                    message: 'User not found'
                });
            }

            // Check if account is locked due to failed attempts
            if (user.lockUntil && user.lockUntil > Date.now()) {
                const remainingTime = Math.ceil((user.lockUntil - Date.now()) / (60 * 60 * 1000));
                return res.status(401).json({
                    status: 'error',
                    message: `Your account is locked for ${remainingTime} more hours due to too many failed login attempts. Please try again later or contact support.`
                });
            }

            // Check if account is blocked by admin
            if (user.isBlocked && user.blockExpiresAt && user.blockExpiresAt > Date.now()) {
                return res.status(401).json({
                    status: 'error',
                    message: `Your account has been blocked. Reason: ${user.blockReason || 'No reason provided'}. Please contact support.`
                });
            }

            // If block has expired, reset the block status
            if (user.isBlocked && (!user.blockExpiresAt || user.blockExpiresAt <= Date.now())) {
                await user.resetLoginAttempts();
            }

            req.user = user;
            next();
        } catch (error) {
            // Token expired, try to refresh
            if (error.name === 'TokenExpiredError') {
                const refreshToken = req.cookies.refreshToken;

                if (!refreshToken) {
                    return res.status(401).json({
                        status: 'error',
                        message: 'Session expired. Please login again.'
                    });
                }

                try {
                    // Verify refresh token
                    const payload = verifyRefreshToken(refreshToken);
                    const user = await User.findById(payload.id);

                    if (!user || user.refreshToken !== refreshToken) {
                        return res.status(401).json({
                            status: 'error',
                            message: 'Invalid refresh token. Please login again.'
                        });
                    }

                    // Check if account is locked or blocked
                    if (user.lockUntil && user.lockUntil > Date.now()) {
                        const remainingTime = Math.ceil((user.lockUntil - Date.now()) / (60 * 60 * 1000));
                        return res.status(401).json({
                            status: 'error',
                            message: `Your account is locked for ${remainingTime} more hours due to too many failed login attempts. Please try again later or contact support.`
                        });
                    }

                    if (user.isBlocked && user.blockExpiresAt && user.blockExpiresAt > Date.now()) {
                        return res.status(401).json({
                            status: 'error',
                            message: `Your account has been blocked. Reason: ${user.blockReason || 'No reason provided'}. Please contact support.`
                        });
                    }

                    // Generate new access token
                    const newToken = generateToken({ id: user._id });

                    // Set new token in cookie
                    res.cookie('token', newToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'strict',
                        maxAge: 15 * 60 * 1000 // 15 minutes
                    });

                    // Set new token in header for this request
                    req.headers.authorization = `Bearer ${newToken}`;
                    req.user = user;
                    next();
                } catch (refreshError) {
                    return res.status(401).json({
                        status: 'error',
                        message: 'Session expired. Please login again.'
                    });
                }
            } else {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid token'
                });
            }
        }
    } catch (error) {
        return res.status(401).json({
            status: 'error',
            message: 'Authentication failed'
        });
    }
};

// Middleware to check if user is admin
exports.isAdmin = async (req, res, next) => {
    try {
        await exports.verifyToken(req, res, () => {
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    status: 'error',
                    message: 'Access denied. Admin privileges required.'
                });
            }
            next();
        });
    } catch (error) {
        return res.status(401).json({
            status: 'error',
            message: 'Authentication failed'
        });
    }
};

// Middleware to check user roles
exports.hasRole = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            await exports.verifyToken(req, res, () => {
                if (!req.user) {
                    return res.status(401).json({
                        status: 'error',
                        message: 'Authentication required'
                    });
                }

                if (!allowedRoles.includes(req.user.role)) {
                    return res.status(403).json({
                        status: 'error',
                        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
                    });
                }

                next();
            });
        } catch (error) {
            return res.status(401).json({
                status: 'error',
                message: 'Authentication failed'
            });
        }
    };
};

// Middleware to check if user has any of the required roles
exports.hasAnyRole = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            await exports.verifyToken(req, res, () => {
                if (!req.user) {
                    return res.status(401).json({
                        status: 'error',
                        message: 'Authentication required'
                    });
                }

                if (!allowedRoles.includes(req.user.role)) {
                    return res.status(403).json({
                        status: 'error',
                        message: `Access denied. Required one of these roles: ${allowedRoles.join(', ')}`
                    });
                }

                next();
            });
        } catch (error) {
            return res.status(401).json({
                status: 'error',
                message: 'Authentication failed'
            });
        }
    };
};

// Middleware to check if user has all required roles
exports.hasAllRoles = (...requiredRoles) => {
    return async (req, res, next) => {
        try {
            await exports.verifyToken(req, res, () => {
                if (!req.user) {
                    return res.status(401).json({
                        status: 'error',
                        message: 'Authentication required'
                    });
                }

                const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
                const hasAllRoles = requiredRoles.every(role => userRoles.includes(role));

                if (!hasAllRoles) {
                    return res.status(403).json({
                        status: 'error',
                        message: `Access denied. Required all these roles: ${requiredRoles.join(', ')}`
                    });
                }

                next();
            });
        } catch (error) {
            return res.status(401).json({
                status: 'error',
                message: 'Authentication failed'
            });
        }
    };
}; 