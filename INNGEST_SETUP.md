# Inngest Setup Guide

This guide explains how to set up and use Inngest in this Node.js secure authentication project.

## What is Inngest?

Inngest is a platform for building reliable, event-driven workflows and background jobs. It provides:

- Automatic retries with exponential backoff
- Scheduled jobs (cron)
- Event-driven architecture
- Reliable job execution
- Built-in observability

## Installation

Inngest is already included in `package.json`. Install dependencies:

```bash
npm install
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Inngest Configuration
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key

# For local development, you can use:
# INNGEST_EVENT_KEY=local-dev-key
```

### Local Development

#### Option 1: Using Inngest Dev Server (Recommended)

Run the Inngest dev server alongside your application:

```bash
# Terminal 1: Start your server
npm run dev

# Terminal 2: Start Inngest dev server
npm run dev:inngest
```

Or use the provided script (Linux/Mac):

```bash
chmod +x start-dev.sh
./start-dev.sh
```

**Note:** The `npm run dev:all` command is not defined in package.json. Use the `start-dev.sh` script or run both commands in separate terminals.

The Inngest dev server will:

- Start on `http://localhost:8288`
- Provide a dashboard to view function executions
- Show real-time logs and job status
- Allow you to trigger events manually for testing

#### Option 2: Development Mode (Without Dev Server)

If you don't run the dev server, Inngest will still work in development mode:

- Jobs execute immediately
- Logs appear in your console
- No dashboard available

```bash
npm run dev
```

### Production Setup

1. **Sign up for Inngest**

   - Go to [inngest.com](https://www.inngest.com/)
   - Create a free account

2. **Create an App**

   - Create a new app in the Inngest dashboard
   - Copy your Event Key and Signing Key

3. **Configure Environment Variables**

   - Add `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` to your production environment

4. **Deploy**
   - Deploy your application
   - Inngest will automatically discover and register your functions via the `/api/inngest` endpoint

## Architecture

### Event Flow

```
Controller → Inngest Event → Inngest Function → Background Job
```

### Example: User Registration Flow

1. User registers via `/api/auth/register`
2. Controller stores user data in `PendingUser` collection (NOT in User collection)
3. Controller triggers `user/registration.pending` event
4. Inngest function `send-registration-email` receives event
5. Verification email is sent asynchronously (non-blocking)
6. API responds immediately to user

### Example: Email Verification Flow

1. User clicks verification link with code
2. Controller verifies code and triggers `user/email.verified` event
3. Inngest function `create-user-after-verification` receives event
4. User is created in `User` collection from `PendingUser` data
5. Function triggers `user/created` event
6. Inngest function `send-email-verified-notification` sends confirmation email
7. API responds to user

## Available Event Constants

All event names are defined as constants in `src/config/inngestConfig.js`:

```javascript
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
```

**Note:** Some events like `user/created` are triggered internally and not exported as constants.

## Available Functions

All Inngest functions are located in `src/inngest/functions/` and exported from `src/inngest/functions/index.js`.

### Email Functions

#### `send-registration-email`

- **Event**: `user/registration.pending`
- **Purpose**: Sends verification email after registration (user stored in PendingUser)
- **Data**: `{ email, name, verificationCode, verifyUrl }`
- **Triggered by**: Registration controller after creating PendingUser

#### `send-email-verified-notification`

- **Event**: `user/created` (triggered internally by `create-user-after-verification`)
- **Purpose**: Sends confirmation email after user account is created
- **Data**: `{ email, name }`
- **Triggered by**: `create-user-after-verification` function after creating User

#### `create-user-after-verification`

- **Event**: `user/email.verified`
- **Purpose**: Creates user in database after email verification
- **Data**: `{ email, verificationCode, name }`
- **Process**:
  1. Finds PendingUser by email and verification code
  2. Creates User in database
  3. Deletes PendingUser
  4. Triggers `user/created` event for confirmation email

#### `send-password-reset-email`

- **Event**: `user/password.reset.requested`
- **Purpose**: Sends password reset link
- **Data**: `{ email, resetUrl }`
- **Note**: Function exists but password reset currently sends emails directly. Can be migrated to use this function.

### Cleanup Functions (Scheduled)

#### `cleanup-expired-tokens`

- **Schedule**: Daily at 2 AM (cron: `0 2 * * *`)
- **Purpose**: Removes expired blacklisted tokens from database
- **Frequency**: Once per day
- **Collection**: `BlacklistedToken`

#### `cleanup-expired-reset-tokens`

- **Schedule**: Every hour (cron: `0 * * * *`)
- **Purpose**: Removes expired password reset tokens from User documents
- **Frequency**: Hourly
- **Collection**: `User` (removes `resetPasswordToken` and `resetPasswordExpires` fields)

#### `cleanup-expired-pending-users`

- **Schedule**: Every hour (cron: `0 * * * *`)
- **Purpose**: Removes expired pending user registrations (not verified within 24 hours)
- **Frequency**: Hourly
- **Collection**: `PendingUser`

#### `unlock-expired-accounts`

- **Schedule**: Every 15 minutes (cron: `*/15 * * * *`)
- **Purpose**: Automatically unlocks accounts after lockout period expires
- **Frequency**: Every 15 minutes
- **Collection**: `User` (resets `isBlocked`, `lockUntil`, `loginAttempts`)

## Usage Examples

### Triggering Events from Controllers

```javascript
import { inngest, Events } from "../config/inngestConfig.js";

// Trigger registration email (for pending user)
await inngest.send({
  name: Events.USER_REGISTRATION_PENDING,
  data: {
    email: "user@example.com",
    name: "John Doe",
    verificationCode: "123456",
    verifyUrl: "https://example.com/verify?email=user@example.com&code=123456",
  },
});

// Trigger email verification (creates user in database)
await inngest.send({
  name: Events.EMAIL_VERIFIED,
  data: {
    email: "user@example.com",
    verificationCode: "123456",
    name: "John Doe",
  },
});

// Trigger password reset email
await inngest.send({
  name: Events.PASSWORD_RESET_REQUESTED,
  data: {
    email: "user@example.com",
    resetUrl: "https://example.com/reset-password?token=abc123",
  },
});
```

### Creating New Functions

Create a new file in `src/inngest/functions/`:

```javascript
import { inngest, Events } from "../../config/inngestConfig.js";

export const myNewFunction = inngest.createFunction(
  { id: "my-new-function" },
  { event: Events.MY_EVENT },
  async ({ event, step }) => {
    return await step.run("do-something", async () => {
      // Your logic here
      console.log("Event data:", event.data);
      return { success: true };
    });
  }
);
```

Don't forget to export it in `src/inngest/functions/index.js`:

```javascript
export * from "./myNewFunction.js";
```

## Monitoring

### Inngest Dashboard

Access the Inngest dashboard to:

- View all function executions
- Monitor job status and retries
- Debug failed jobs
- View execution logs
- Set up alerts

### Local Logs

In development mode, all function executions are logged to the console with:

- ✅ Success indicators
- ❌ Error indicators
- Detailed execution information

## Best Practices

1. **Non-blocking Operations**: Always use Inngest for operations that don't need immediate response (emails, notifications, cleanup tasks, etc.)

2. **Error Handling**: Inngest automatically retries failed jobs with exponential backoff. Make sure your functions handle errors gracefully and throw errors when retries are needed.

3. **Idempotency**: Design functions to be idempotent (safe to run multiple times). This is especially important for scheduled jobs and retries.

4. **Event Data**: Keep event data minimal and focused. Don't send sensitive data like passwords in events. Use IDs or tokens instead.

5. **Testing**: Test Inngest functions locally before deploying to production. Use the Inngest dev server to monitor function executions.

6. **Event Naming**: Use consistent event naming conventions. Follow the pattern `resource/action` (e.g., `user/registration.pending`).

7. **Function Organization**: Group related functions in separate files (e.g., `emailFunctions.js`, `cleanupFunctions.js`) for better maintainability.

## Troubleshooting

### Functions Not Executing

1. Check that Inngest endpoint is accessible: `http://localhost:5000/api/inngest`
2. Verify environment variables are set correctly (`INNGEST_EVENT_KEY`)
3. Check console logs for errors
4. Verify function exports in `src/inngest/functions/index.js`
5. Ensure all functions are properly exported from the index file
6. Check that Inngest dev server is running (if using dev mode)
7. Verify event names match exactly (case-sensitive)

### Jobs Failing

1. Check Inngest dashboard for error details
2. Review function logs
3. Verify dependencies (email service, database) are accessible
4. Check function error handling

### Scheduled Jobs Not Running

1. Verify cron syntax is correct (e.g., `0 2 * * *` for daily at 2 AM)
2. Check Inngest dashboard for scheduled job status
3. Ensure Inngest is running in production mode (scheduled jobs may not run in dev mode)
4. Verify timezone settings (cron uses UTC by default)
5. Check that functions are properly registered in Inngest dashboard

### Registration Email Not Sending

1. Verify `PendingUser` is created successfully
2. Check that `user/registration.pending` event is triggered
3. Verify SendGrid API key is configured correctly
4. Check email service logs for SendGrid errors
5. Ensure email template exists and is correct

### User Not Created After Verification

1. Verify `user/email.verified` event is triggered
2. Check that `PendingUser` exists with matching email and verification code
3. Verify `create-user-after-verification` function executes successfully
4. Check database for User creation
5. Verify `PendingUser` is deleted after User creation

## Resources

- [Inngest Documentation](https://www.inngest.com/docs)
- [Inngest Express Integration](https://www.inngest.com/docs/quick-start/express)
- [Inngest Functions Guide](https://www.inngest.com/docs/functions)
