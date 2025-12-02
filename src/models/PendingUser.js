import mongoose from "mongoose";

const pendingUserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    password: { type: String, required: true }, // Hashed password
    role: {
      type: String,
      enum: ["user", "superAdmin", "admin"],
      default: "user",
    },
    verificationCode: { type: String, required: true },
    expiresAt: { type: Date, required: true }, // 24 hours from registration
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
pendingUserSchema.index({ email: 1 });
pendingUserSchema.index({ verificationCode: 1 });
pendingUserSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired

export default mongoose.model("PendingUser", pendingUserSchema);
