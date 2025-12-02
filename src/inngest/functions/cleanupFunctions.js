import { inngest, Events } from "../../config/inngestConfig.js";
import BlacklistedToken from "../../models/BlacklistedToken.js";
import User from "../../models/User.js";
import PendingUser from "../../models/PendingUser.js";

/**
 * Cleanup expired blacklisted tokens
 * Runs daily to remove expired tokens from the database
 */
export const cleanupExpiredTokens = inngest.createFunction(
  { id: "cleanup-expired-tokens" },
  { cron: "0 2 * * *" }, // Run daily at 2 AM
  async ({ step }) => {
    return await step.run("cleanup-expired-tokens", async () => {
      try {
        const now = new Date();
        const result = await BlacklistedToken.deleteMany({
          expiresAt: { $lt: now },
        });

        console.log(
          `✅ Cleaned up ${result.deletedCount} expired blacklisted tokens`
        );
        return {
          success: true,
          deletedCount: result.deletedCount,
          timestamp: now.toISOString(),
        };
      } catch (error) {
        console.error("❌ Failed to cleanup expired tokens:", error);
        throw error;
      }
    });
  }
);

/**
 * Cleanup expired password reset tokens
 * Runs hourly to remove expired reset tokens
 */
export const cleanupExpiredResetTokens = inngest.createFunction(
  { id: "cleanup-expired-reset-tokens" },
  { cron: "0 * * * *" }, // Run every hour
  async ({ step }) => {
    return await step.run("cleanup-expired-reset-tokens", async () => {
      try {
        const now = Date.now();
        const result = await User.updateMany(
          {
            resetPasswordExpires: { $lt: now },
            resetPasswordToken: { $exists: true },
          },
          {
            $unset: {
              resetPasswordToken: "",
              resetPasswordExpires: "",
            },
          }
        );

        console.log(
          `✅ Cleaned up expired reset tokens for ${result.modifiedCount} users`
        );
        return {
          success: true,
          modifiedCount: result.modifiedCount,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error("❌ Failed to cleanup expired reset tokens:", error);
        throw error;
      }
    });
  }
);

/**
 * Unlock accounts that have passed their lockout period
 * Runs every 15 minutes to check and unlock accounts
 */
export const unlockExpiredAccounts = inngest.createFunction(
  { id: "unlock-expired-accounts" },
  { cron: "*/15 * * * *" }, // Run every 15 minutes
  async ({ step }) => {
    return await step.run("unlock-expired-accounts", async () => {
      try {
        const now = Date.now();
        const result = await User.updateMany(
          {
            lockUntil: { $lt: now },
            isBlocked: true,
            blockReason: "Too many failed login attempts",
          },
          {
            $set: {
              isBlocked: false,
              loginAttempts: 0,
            },
            $unset: {
              lockUntil: "",
              blockReason: "",
              blockExpiresAt: "",
            },
          }
        );

        console.log(
          `✅ Unlocked ${result.modifiedCount} expired locked accounts`
        );
        return {
          success: true,
          unlockedCount: result.modifiedCount,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error("❌ Failed to unlock expired accounts:", error);
        throw error;
      }
    });
  }
);

/**
 * Cleanup expired pending user registrations
 * Runs hourly to remove expired pending registrations
 */
export const cleanupExpiredPendingUsers = inngest.createFunction(
  { id: "cleanup-expired-pending-users" },
  { cron: "0 * * * *" }, // Run every hour
  async ({ step }) => {
    return await step.run("cleanup-expired-pending-users", async () => {
      try {
        const now = new Date();
        const result = await PendingUser.deleteMany({
          expiresAt: { $lt: now },
        });

        console.log(
          `✅ Cleaned up ${result.deletedCount} expired pending user registrations`
        );
        return {
          success: true,
          deletedCount: result.deletedCount,
          timestamp: now.toISOString(),
        };
      } catch (error) {
        console.error("❌ Failed to cleanup expired pending users:", error);
        throw error;
      }
    });
  }
);
