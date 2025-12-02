import { Inngest } from "inngest";

// Initialize Inngest client
export const inngest = new Inngest({
  id: "nodejs-secure-auth",
  name: "NodeJS Secure Auth",
  eventKey: process.env.INNGEST_EVENT_KEY || "local-dev-key",
});

// Event names as constants for type safety
export const Events = {
  USER_REGISTRATION_PENDING: "user/registration.pending",
  USER_REGISTERED: "user/registered",
  EMAIL_VERIFIED: "user/email.verified",
  PASSWORD_RESET_REQUESTED: "user/password.reset.requested",
  PASSWORD_RESET_COMPLETED: "user/password.reset.completed",
  USER_LOGIN: "user/login",
  USER_LOGOUT: "user/logout",
  ACCOUNT_LOCKED: "user/account.locked",
  CLEANUP_EXPIRED_TOKENS: "cleanup/expired.tokens",
  CLEANUP_EXPIRED_RESET_TOKENS: "cleanup/expired.reset.tokens",
  CLEANUP_EXPIRED_PENDING_USERS: "cleanup/expired.pending.users",
  UNLOCK_ACCOUNTS: "cleanup/unlock.accounts",
};

export default inngest;
