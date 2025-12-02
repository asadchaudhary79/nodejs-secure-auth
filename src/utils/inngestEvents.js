import { inngest, Events } from "../config/inngestConfig.js";

/**
 * Utility functions to trigger Inngest events
 * These functions provide a clean interface for triggering background jobs
 */

/**
 * Trigger user registration email event
 */
export const triggerRegistrationEmail = async (data) => {
  try {
    await inngest.send({
      name: Events.USER_REGISTERED,
      data: {
        email: data.email,
        name: data.name,
        verificationCode: data.verificationCode,
        verifyUrl: data.verifyUrl,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to trigger registration email event:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Trigger email verified notification event
 */
export const triggerEmailVerifiedNotification = async (data) => {
  try {
    await inngest.send({
      name: Events.EMAIL_VERIFIED,
      data: {
        email: data.email,
        name: data.name,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to trigger email verified event:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Trigger password reset email event
 */
export const triggerPasswordResetEmail = async (data) => {
  try {
    await inngest.send({
      name: Events.PASSWORD_RESET_REQUESTED,
      data: {
        email: data.email,
        resetUrl: data.resetUrl,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to trigger password reset email event:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Trigger user login event (for analytics/tracking)
 */
export const triggerUserLogin = async (data) => {
  try {
    await inngest.send({
      name: Events.USER_LOGIN,
      data: {
        userId: data.userId,
        email: data.email,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to trigger user login event:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Trigger account locked event
 */
export const triggerAccountLocked = async (data) => {
  try {
    await inngest.send({
      name: Events.ACCOUNT_LOCKED,
      data: {
        userId: data.userId,
        email: data.email,
        lockUntil: data.lockUntil,
        reason: data.reason,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to trigger account locked event:", error);
    return { success: false, error: error.message };
  }
};

