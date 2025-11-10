import User from "../models/User.js";
import bcrypt from "bcrypt";
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { sendEmail } from "../services/emailService.js";
import {
  generateTwoFactorSecret,
  generateQRCode,
  verifyTwoFactorToken as verify2FAToken,
  generateCurrentToken,
} from "../utils/twoFactorAuth.js";
import crypto from "crypto";
import BlacklistedToken from "../models/BlacklistedToken.js";

export const register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email or phone already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString(); // 6 digits

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      verificationCode,
      role: role || "user",
      passwordHistory: [{ password: hashedPassword }],
    });

    const verifyUrl = `${process.env.BACKEND_RUL}/verify-email?email=${email}&code=${user.verificationCode}`;

    try {
      await sendEmail({
        to: email,
        subject: "Verify your email",
        template: "register",
        data: {
          name: user.name,
          code: verificationCode,
          verifyUrl,
        },
      });
    } catch (err) {
      console.log(`Email not sent for user ${email}:`, err.message);
    }

    res
      .status(201)
      .json({ message: "User registered. Please verify your email." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error registering user", error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    const user = await User.findOne(email ? { email } : { phone });

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "User not found",
      });
    }

    if (user.isLocked) {
      const remainingTime = Math.ceil(
        (user.lockUntil - Date.now()) / (60 * 60 * 1000)
      );
      return res.status(401).json({
        status: "error",
        message: `Your account is locked for ${remainingTime} more hours due to too many failed login attempts. Please try again later or contact support.`,
      });
    }

    if (!user.isVerified) {
      return res.status(400).json({
        status: "error",
        message:
          "Email not verified. Please verify your email before logging in.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      const attemptsLeft = 5 - (user.loginAttempts + 1);
      return res.status(400).json({
        status: "error",
        message: `Invalid credentials. ${attemptsLeft} attempts remaining before account is locked for 24 hours.`,
      });
    }

    await user.resetLoginAttempts();

    // Check if 2FA is enabled - MANDATORY verification required
    if (user.is2FaActivated) {
      return res.status(200).json({
        status: "2fa_required",
        message:
          "Two-factor authentication is enabled. Please enter your 2FA token to complete login.",
        data: {
          email: user.email,
          phone: user.phone,
          requires2FA: true,
          message: "Enter the 6-digit code from your authenticator app",
        },
      });
    }

    // If 2FA is not enabled, proceed with normal login
    const token = generateToken({ id: user._id });
    const refreshToken = generateRefreshToken({ id: user._id });
    user.refreshToken = refreshToken;
    await user.save();

    //Set HTTP - only cookies
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes (adjust as needed)
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (adjust as needed)
    });

    res.json({
      status: "success",
      message: "Login successful",
      data: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is2FaActivated: user.is2FaActivated,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      status: "error",
      message: "Error logging in",
      error: error.message,
    });
  }
};

export const verifyEmail = async (req, res) => {
  const { code, email } = req.query;
  const user = await User.findOne({ email, verificationCode: code });
  if (!user) return res.status(400).json({ message: "Invalid code or email" });
  user.isVerified = true;
  user.verificationCode = undefined;
  await user.save();

  // Send email verified notification
  try {
    await sendEmail({
      to: user.email,
      subject: "Your email has been verified!",
      template: "emailVerified",
      data: { name: user.name },
    });
  } catch (err) {
    console.log(
      `Email verified notification not sent for user ${user.email}:`,
      err.message
    );
  }

  res.json({ message: "Email verified successfully" });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });
  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
  try {
    await sendEmail({
      to: email,
      subject: "Reset your password",
      template: "forgotPassword",
      data: resetUrl,
    });
  } catch (err) {
    console.log(
      `Password reset email not sent for user ${email}:`,
      err.message
    );
  }
  res.json({ message: "Password reset email sent" });
};

export const resetPassword = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(400).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Check if password was used before
    const wasUsedBefore = await user.isPasswordUsedBefore(password);
    if (wasUsedBefore) {
      return res.status(400).json({
        message:
          "This password was used before. Please choose a different password.",
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

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error resetting password", error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        status: "error",
        message: "Authorization token required",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Invalid authorization format",
      });
    }

    // Blacklist the current token
    const expiresAt = new Date(
      Date.now() + (parseInt(process.env.JWT_EXPIRES_IN) || 15) * 60 * 1000
    );
    await BlacklistedToken.create({ token, expiresAt });

    // Clear cookies
    res.clearCookie("token");
    res.clearCookie("refreshToken");

    res.json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error during logout",
      error: error.message,
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    // Accept refreshToken from cookies or request body
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        status: "error",
        message: "No refresh token provided",
      });
    }

    // Check if refresh token is blacklisted
    const blacklisted = await BlacklistedToken.findOne({ token: refreshToken });
    if (blacklisted) {
      return res.status(401).json({
        status: "error",
        message: "Refresh token has been invalidated",
      });
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      // Clear cookies if refresh token is expired
      res.clearCookie("token");
      res.clearCookie("refreshToken");

      return res.status(401).json({
        status: "error",
        message: "Session expired. Please login again.",
      });
    }

    const user = await User.findById(payload.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid refresh token",
      });
    }

    // Generate new tokens
    const newToken = generateToken({ id: user._id });
    const newRefreshToken = generateRefreshToken({ id: user._id });

    // Update user's refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    // Set new cookies
    res.cookie("token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      status: "success",
      message: "Token refreshed successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error refreshing token",
      error: error.message,
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    // req.user is set by verifyToken middleware
    if (!req.user) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }
    res.json({
      status: "success",
      data: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        is2FaActivated: req.user.is2FaActivated,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error fetching profile",
      error: error.message,
    });
  }
};

// Setup 2FA (protected)
export const setupTwoFactor = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }
    // Prevent setup if 2FA is already enabled
    if (user.is2FaActivated) {
      return res.status(400).json({
        status: "error",
        message: "2FA is already activated for this account.",
      });
    }
    // Only generate a new secret if one does not exist
    if (!user.twoFactorSecret) {
      const secret = generateTwoFactorSecret();
      user.twoFactorSecret = secret.base32;
      await user.save();
    } else {
      console.log(
        `ℹ️ Existing 2FA secret reused for user ${user.email}: ${user.twoFactorSecret}`
      );
    }
    // Generate QR code
    const qrCode = await generateQRCode(
      { base32: user.twoFactorSecret },
      user.email
    );
    res.json({
      status: "success",
      message: "2FA setup initiated",
      data: {
        qrCode,
        secret: user.twoFactorSecret,
        manualEntryKey: user.twoFactorSecret,
      },
    });
  } catch (error) {
    console.error("2FA setup error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to setup 2FA",
      error: error.message,
    });
  }
};

// Verify 2FA setup and activate
export const verifyTwoFactorSetup = async (req, res) => {
  try {
    // Only accept { token } in the body
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        status: "error",
        message: "2FA token is required in the request body.",
      });
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found." });
    }
    if (!user.twoFactorSecret) {
      return res.status(400).json({
        status: "error",
        message: "2FA setup not initiated. Please setup 2FA first.",
      });
    }
    if (user.is2FaActivated) {
      return res
        .status(400)
        .json({ status: "error", message: "2FA is already activated." });
    }
    // Verify the token
    const isValid = verify2FAToken(user.twoFactorSecret, token);
    if (!isValid) {
      return res.status(400).json({
        status: "error",
        message:
          "Invalid or expired 2FA token. Please check your authenticator app and try again. If the problem persists, re-scan the QR code.",
      });
    }
    user.is2FaActivated = true;
    await user.save();
    res.json({
      status: "success",
      message: "2FA has been activated successfully!",
    });
  } catch (error) {
    console.error("2FA verification error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to verify 2FA setup",
      error: error.message,
    });
  }
};

// Enable 2FA (if previously disabled)
export const enableTwoFactor = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    if (user.is2FaActivated) {
      return res.status(400).json({
        status: "error",
        message: "2FA is already enabled",
      });
    }

    // Generate new secret if not exists
    if (!user.twoFactorSecret) {
      const secret = generateTwoFactorSecret();
      user.twoFactorSecret = secret.base32;
    }

    user.is2FaActivated = true;
    await user.save();

    res.json({
      status: "success",
      message: "2FA has been enabled successfully!",
    });
  } catch (error) {
    console.error("Enable 2FA error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to enable 2FA",
      error: error.message,
    });
  }
};

// Disable 2FA
export const disableTwoFactor = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }
    if (!user.is2FaActivated) {
      return res.status(400).json({
        status: "error",
        message: "2FA is not enabled for this account",
      });
    }
    // Disable 2FA and clear secret
    user.is2FaActivated = false;
    user.twoFactorSecret = null;
    await user.save();
    res.json({
      status: "success",
      message: "2FA has been disabled successfully!",
    });
  } catch (error) {
    console.error("Disable 2FA error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to disable 2FA",
      error: error.message,
    });
  }
};

// Verify 2FA token during login (email + token only) - MANDATORY when 2FA is enabled
export const verifyTwoFactorToken = async (req, res) => {
  try {
    const { email, token } = req.body;

    // Validate required fields
    if (!email || !token) {
      return res.status(400).json({
        status: "error",
        message: "Both email and 2FA token are required.",
      });
    }

    // Validate token format (6 digits)
    if (!/^\d{6}$/.test(token)) {
      return res.status(400).json({
        status: "error",
        message: "2FA token must be a 6-digit number.",
      });
    }
    // Find user by email only
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found.",
      });
    }
    // Check if 2FA is enabled for this user
    if (!user.is2FaActivated) {
      return res.status(400).json({
        status: "error",
        message: "Two-factor authentication is not enabled for this account.",
      });
    }

    // Check if 2FA secret exists
    if (!user.twoFactorSecret) {
      return res.status(400).json({
        status: "error",
        message: "2FA secret not found. Please setup 2FA again.",
      });
    }

    // Generate current valid token for comparison
    const currentValidToken = generateCurrentToken(user.twoFactorSecret);

    // Verify the token
    const isValid = verify2FAToken(user.twoFactorSecret, token);

    if (!isValid) {
      return res.status(400).json({
        status: "error",
        message:
          "Invalid 2FA token. Please check your authenticator app and try again.",
        debug: {
          receivedToken: token,
          expectedToken: currentValidToken,
          timestamp: new Date().toISOString(),
          hint: "Make sure your device time is synchronized and you're using the current 6-digit code",
        },
      });
    }
    // Generate tokens and set cookies
    const accessToken = generateToken({ id: user._id });
    const refreshToken = generateRefreshToken({ id: user._id });
    user.refreshToken = refreshToken;
    await user.save();

    // Set HTTP-only cookies
    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      status: "success",
      message:
        "Two-factor authentication verified successfully. Login completed.",
      data: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is2FaActivated: user.is2FaActivated,
      },
    });
  } catch (error) {
    console.error("❌ 2FA verification error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to verify 2FA token",
      error: error.message,
    });
  }
};

// Default export for backward compatibility
export default {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  logout,
  refreshToken,
  getProfile,
  setupTwoFactor,
  verifyTwoFactorSetup,
  enableTwoFactor,
  disableTwoFactor,
  verifyTwoFactorToken,
};
