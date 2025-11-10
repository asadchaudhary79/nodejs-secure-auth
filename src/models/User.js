import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    phone: { type: String, unique: true, sparse: true },
    password: String,
    role: {
      type: String,
      enum: ["user", "superAdmin", "admin"],
      default: "user",
    },
    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    blockReason: String,
    blockExpiresAt: Date,
    blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    blockedAt: Date,
    verificationToken: String,
    verificationCode: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    refreshToken: String,
    passwordUpdateTimestamp: { type: Date, default: Date.now },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    lastLogin: { type: Date },
    passwordHistory: [
      {
        password: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    is2FaActivated: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for checking if account is locked
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now()) || this.isBlocked;
});

// Method to increment login attempts
userSchema.methods.incrementLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5) {
    const blockExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    updates.$set = {
      lockUntil: blockExpiresAt,
      isBlocked: true,
      blockReason: "Too many failed login attempts",
      blockExpiresAt: blockExpiresAt,
    };
  }
  return await this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = async function () {
  return await this.updateOne({
    $set: {
      loginAttempts: 0,
      lastLogin: Date.now(),
      isBlocked: false,
      blockReason: null,
      blockExpiresAt: null,
    },
    $unset: { lockUntil: 1 },
  });
};

// Method to check if password was used before
userSchema.methods.isPasswordUsedBefore = async function (newPassword) {
  for (const history of this.passwordHistory) {
    if (await bcrypt.compare(newPassword, history.password)) {
      return true;
    }
  }
  return false;
};

// Method to add password to history
userSchema.methods.addPasswordToHistory = async function (password) {
  const hashedPassword = await bcrypt.hash(password, 12);
  this.passwordHistory.push({ password: hashedPassword });
  if (this.passwordHistory.length > 5) {
    this.passwordHistory.shift(); // Keep only last 5 passwords
  }
  await this.save();
};

export default mongoose.model("User", userSchema);
