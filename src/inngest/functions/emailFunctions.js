import { inngest, Events } from "../../config/inngestConfig.js";
import { sendEmail } from "../../services/emailService.js";

/**
 * Send registration verification email for pending users
 */
export const sendRegistrationEmail = inngest.createFunction(
  { id: "send-registration-email" },
  { event: Events.USER_REGISTRATION_PENDING },
  async ({ event, step }) => {
    const { email, name, verificationCode, verifyUrl } = event.data;

    return await step.run("send-registration-email", async () => {
      try {
        await sendEmail({
          to: email,
          subject: "Verify your email",
          template: "register",
          data: {
            name,
            code: verificationCode,
            verifyUrl,
          },
        });

        console.log(`✅ Registration email sent to ${email}`);
        return { success: true, email };
      } catch (error) {
        console.error(
          `❌ Failed to send registration email to ${email}:`,
          error
        );
        throw error;
      }
    });
  }
);

/**
 * Send email verified notification after user is created
 * This runs after the user is created in the database
 */
export const sendEmailVerifiedNotification = inngest.createFunction(
  { id: "send-email-verified-notification" },
  { event: "user/created" }, // Triggered after user creation
  async ({ event, step }) => {
    const { email, name } = event.data;

    return await step.run("send-email-verified-notification", async () => {
      try {
        await sendEmail({
          to: email,
          subject: "Your email has been verified!",
          template: "verifyEmail",
          data: { name },
        });

        console.log(`✅ Email verified notification sent to ${email}`);
        return { success: true, email };
      } catch (error) {
        console.error(
          `❌ Failed to send email verified notification to ${email}:`,
          error
        );
        throw error;
      }
    });
  }
);

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = inngest.createFunction(
  { id: "send-password-reset-email" },
  { event: Events.PASSWORD_RESET_REQUESTED },
  async ({ event, step }) => {
    const { email, resetUrl } = event.data;

    return await step.run("send-password-reset-email", async () => {
      try {
        await sendEmail({
          to: email,
          subject: "Reset your password",
          template: "forgotPassword",
          data: resetUrl,
        });

        console.log(`✅ Password reset email sent to ${email}`);
        return { success: true, email };
      } catch (error) {
        console.error(
          `❌ Failed to send password reset email to ${email}:`,
          error
        );
        throw error;
      }
    });
  }
);
