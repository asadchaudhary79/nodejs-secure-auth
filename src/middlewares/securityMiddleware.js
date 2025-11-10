import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import { body, validationResult } from "express-validator";

const phoneRegex = /^\+92[0-9]{10}$/;

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // 5 attempts
  message: {
    status: "error",
    message:
      "Your account has been blocked for 24 hours due to too many failed login attempts. Please try again later or contact support.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts
  message: "Too many registration attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts
  message: "Too many password reset attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Input validation
const validateRegistration = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/)
    .withMessage(
      "Password must include one lowercase character, one uppercase character, a number, and a special character"
    ),
  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(phoneRegex)
    .withMessage("Phone number must be in the format +923XXXXXXXXX"),
  body("role")
    .optional()
    .isIn(["user", "vendor", "admin"])
    .withMessage("Invalid role"),
];

const validateLogin = [
  body("email").optional().isEmail().withMessage("Please enter a valid email"),
  body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Please enter a valid phone number"),
  body("password").notEmpty().withMessage("Password is required"),
];

const validatePasswordReset = [
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/)
    .withMessage(
      "Password must include one lowercase character, one uppercase character, a number, and a special character"
    ),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match");
    }
    return true;
  }),
];

const validatePhone = body("phone")
  .matches(phoneRegex)
  .withMessage("Phone number must be in the format +923XXXXXXXXX");

// 2FA validation
const validateTwoFactorToken = [
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("token")
    .isLength({ min: 6, max: 6 })
    .withMessage("2FA token must be exactly 6 digits")
    .isNumeric()
    .withMessage("2FA token must contain only numbers"),
];

const validateTwoFactorSetup = [
  body("token")
    .isLength({ min: 6, max: 6 })
    .withMessage("2FA token must be exactly 6 digits")
    .isNumeric()
    .withMessage("2FA token must contain only numbers"),
];

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Security middleware with CORS-friendly helmet configuration
const securityMiddleware = [
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),
  mongoSanitize(), // Sanitize MongoDB queries
  xss(), // Prevent XSS attacks
  hpp(), // Prevent HTTP Parameter Pollution
];

export {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  validateRegistration,
  validateLogin,
  validatePasswordReset,
  validateTwoFactorToken,
  validateTwoFactorSetup,
  validate,
  securityMiddleware,
  validatePhone,
};
