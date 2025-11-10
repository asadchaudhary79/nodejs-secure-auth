import express from "express";
const router = express.Router();
import authController from "../controllers/authController.js";
import {
  validateRegistration,
  validateLogin,
  validatePasswordReset,
  validateTwoFactorToken,
  validateTwoFactorSetup,
  validate,
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
} from "../middlewares/securityMiddleware.js";
import { verifyToken, hasRole } from "../middlewares/authMiddleware.js";

// Register route with validation
router.post(
  "/register",
  validateRegistration,
  registerLimiter,
  validate,
  authController.register
);

// Login route with validation
router.post(
  "/login",
  loginLimiter,
  validateLogin,
  validate,
  authController.login
);

// Email verification route
router.get("/verify-email", authController.verifyEmail);

// Forgot password route
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  authController.forgotPassword
);

// Reset password route with validation
router.post(
  "/reset-password",
  validatePasswordReset,
  validate,
  authController.resetPassword
);

// Token refresh route
router.post("/refresh-token", authController.refreshToken);

/**
 * Protected Routes (Require Authentication)
 */

// Profile route (protected)
router.get("/profile", verifyToken, authController.getProfile);

// Logout route (protected)
router.post("/logout", authController.logout);

/**
 * Two-Factor Authentication Routes
 */

// Setup 2FA (protected)
router.post("/setup-2fa", verifyToken, authController.setupTwoFactor);

// Verify 2FA setup (protected)
router.post(
  "/verify-2fa-setup",
  verifyToken,
  validateTwoFactorSetup,
  validate,
  authController.verifyTwoFactorSetup
);

// Enable 2FA (protected)
router.post("/enable-2fa", verifyToken, authController.enableTwoFactor);

// Disable 2FA (protected)
router.post("/disable-2fa", verifyToken, authController.disableTwoFactor);

// Verify 2FA token during login
router.post(
  "/verify-2fa",
  validateTwoFactorToken,
  validate,
  authController.verifyTwoFactorToken
);

export default router;
