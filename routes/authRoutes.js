const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegistration, validateLogin, validatePasswordReset, validate, validatePhone, loginLimiter, registerLimiter, forgotPasswordLimiter } = require('../middlewares/securityMiddleware');
const { verifyToken } = require('../middlewares/authMiddleware');


// Register route with validation
router.post('/register', validateRegistration, validate, authController.register);

// Login route with validation
router.post('/login', loginLimiter, validateLogin, validate, authController.login);

// Email verification route
router.get('/verify-email', authController.verifyEmail);

// Forgot password route
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);

// Reset password route with validation
router.post('/reset-password', validatePasswordReset, validate, authController.resetPassword);

// Token refresh route
router.post('/refresh-token', authController.refreshToken);

/**
 * Protected Routes (Require Authentication)
 */

// Profile route (protected)
router.get('/profile', verifyToken, authController.getProfile);

// Logout route (protected)
router.post('/logout', authController.logout);



module.exports = router; 