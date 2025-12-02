import { inngest, Events } from "../../config/inngestConfig.js";
import PendingUser from "../../models/PendingUser.js";
import User from "../../models/User.js";

/**
 * Create user after email verification
 * This function is triggered when email is verified
 */
export const createUserAfterVerification = inngest.createFunction(
  { id: "create-user-after-verification" },
  { event: Events.EMAIL_VERIFIED },
  async ({ event, step }) => {
    const { email, verificationCode } = event.data;

    return await step.run("create-user-after-verification", async () => {
      try {
        // Find pending user
        const pendingUser = await PendingUser.findOne({
          email,
          verificationCode,
        });

        if (!pendingUser) {
          throw new Error("Pending user not found or already verified");
        }

        // Check if user already exists (edge case)
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          // Delete pending user and return
          await PendingUser.deleteOne({ _id: pendingUser._id });
          console.log(`⚠️ User ${email} already exists, removed pending registration`);
          return { success: true, message: "User already exists" };
        }

        // Create user in database
        const user = await User.create({
          name: pendingUser.name,
          email: pendingUser.email,
          phone: pendingUser.phone,
          password: pendingUser.password,
          role: pendingUser.role,
          isVerified: true, // Already verified
          passwordHistory: [{ password: pendingUser.password }],
        });

        // Delete pending user
        await PendingUser.deleteOne({ _id: pendingUser._id });

        // Trigger event to send verification confirmation email
        await inngest.send({
          name: "user/created",
          data: {
            email: user.email,
            name: user.name,
          },
        });

        console.log(`✅ User created successfully: ${email}`);
        return {
          success: true,
          userId: user._id,
          email: user.email,
        };
      } catch (error) {
        console.error(`❌ Failed to create user after verification:`, error);
        throw error;
      }
    });
  }
);

