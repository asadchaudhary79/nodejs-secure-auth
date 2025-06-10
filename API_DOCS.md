# RescueWheels API Documentation

## Authentication

All API requests require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer your_jwt_token
```

## Role-Based Authorization

The API implements role-based access control (RBAC) with the following roles:

- `admin`: Full system access
- `moderator`: Limited administrative access
- `user`: Regular user access

### Role Permissions

| Role      | Permissions                                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| admin     | - Full access to all endpoints<br>- Can block/unblock users<br>- Can view all blocked users<br>- Can manage all system settings |
| moderator | - Can view blocked users<br>- Cannot block/unblock users<br>- Limited administrative access                                     |
| user      | - Basic user access<br>- Cannot access administrative endpoints                                                                 |

## Base URL

```
http://localhost:3000/api
```

## Authentication Endpoints

### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
    "name": "string",
    "email": "string",
    "phone": "string",
    "password": "string",
    "role": "string" (optional, defaults to "user")
}
```

**Response:**

```json
{
  "message": "User registered. Please verify your email."
}
```

**Note:** A verification email will be sent with a verification code and link.

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
    "email": "string" (or "phone": "string"),
    "password": "string"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "name": "string",
    "email": "string",
    "role": "string"
  }
}
```

**Note:**

- Sets HTTP-only cookies:
  - `token` (15 minutes expiry)
  - `refreshToken` (7 days expiry)
- Cookies are secure in production
- Cookies are SameSite: strict

### Verify Email

```http
GET /api/auth/verify-email?email={email}&code={code}
```

**Response:**

```json
{
  "message": "Email verified successfully"
}
```

### Logout

```http
POST /api/auth/logout
Authorization: Bearer {token}
```

**Response:**

```json
{
  "message": "Logged out successfully"
}
```

**Note:**

- Requires valid JWT token in Authorization header
- Clears both token and refreshToken cookies
- Blacklists the current token

### Refresh Token

```http
POST /api/auth/refresh-token
Content-Type: application/json

{
    "refreshToken": "string" // Optional if sent as a cookie
}
```

**How to send the refresh token:**

- You can send the refresh token in the request body (as shown above), **or**
- You can send it as a cookie named `refreshToken` (recommended for browser clients).

**Response:**

```json
{
  "status": "success",
  "message": "Token refreshed successfully"
}
```

**Errors:**

- 401 Unauthorized: If the refresh token is missing, invalid, or expired.

### Forgot Password

```http
POST /api/auth/forgot-password
Content-Type: application/json

{
    "email": "string"
}
```

**Response:**

```json
{
  "message": "Password reset email sent"
}
```

### Reset Password

```http
POST /api/auth/reset-password
Content-Type: application/json
Authorization: Bearer {token}

{
    "password": "string",
    "confirmPassword": "string"
}
```

**Response:**

```json
{
  "message": "Password reset successful"
}
```

### Request OTP

```http
POST /api/auth/request-otp
Content-Type: application/json

{
    "phone": "string"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "OTP sent to your mobile number"
}
```

### Verify OTP

```http
POST /api/auth/verify-otp
Content-Type: application/json

{
    "phone": "string",
    "otp": "string"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "name": "string",
    "phone": "string",
    "role": "string",
    "token": "string"
  }
}
```

### Get User Profile

```http
GET /api/auth/profile
Authorization: Bearer {token}
```

**Description:**
Returns the profile information of the currently logged-in user. Requires a valid JWT token in the Authorization header.

**Response:**

```json
{
  "status": "success",
  "data": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "role": "string",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors:**

- 401 Unauthorized: If the token is missing, invalid, or expired.

## Admin Endpoints

All admin endpoints require admin privileges. Include the JWT token in the Authorization header.

### Get Blocked Users

```http
GET /api/admin/blocked-users
Authorization: Bearer {token}
```

**Description:**
Returns a list of all blocked users. Accessible by both admin and moderator roles.

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "blockReason": "string",
      "blockExpiresAt": "2024-01-01T00:00:00.000Z",
      "blockedBy": "string"
    }
  ]
}
```

**Access Control:**

- Required Roles: `admin` or `moderator`
- Returns 403 Forbidden if user doesn't have required role

### Block User

```http
POST /api/admin/block-user/:userId
Authorization: Bearer {token}
Content-Type: application/json

{
    "reason": "string",
    "duration": "number" // Duration in hours (optional)
}
```

**Description:**
Blocks a user from accessing the system. Only accessible by admin role.

**Response:**

```json
{
  "status": "success",
  "message": "User blocked successfully",
  "data": {
    "userId": "string",
    "blockReason": "string",
    "blockExpiresAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Access Control:**

- Required Role: `admin` only
- Returns 403 Forbidden if user doesn't have admin role

### Unblock User

```http
POST /api/admin/unblock-user/:userId
Authorization: Bearer {token}
```

**Description:**
Removes the block from a user. Only accessible by admin role.

**Response:**

```json
{
  "status": "success",
  "message": "User unblocked successfully"
}
```

**Access Control:**

- Required Role: `admin` only
- Returns 403 Forbidden if user doesn't have admin role

## Error Responses

### Authentication Errors

```json
{
  "status": "error",
  "message": "No token provided"
}
```

```json
{
  "status": "error",
  "message": "Token has been invalidated"
}
```

### Authorization Errors

```json
{
  "status": "error",
  "message": "Access denied. Required role: admin"
}
```

```json
{
  "status": "error",
  "message": "Access denied. Required one of these roles: admin, moderator"
}
```

## Security Notes

1. All endpoints require valid JWT token authentication
2. Role-based access control is enforced on all administrative endpoints
3. Tokens are automatically refreshed when expired
4. Failed authentication attempts are logged
5. Account lockout is implemented after multiple failed attempts
6. All sensitive operations are logged for audit purposes

## User Blocking System

The system provides a comprehensive user blocking mechanism:

1. **Block Duration Options**:

   - 1 hour
   - 3 hours
   - 6 hours
   - 12 hours
   - 24 hours (1 day)
   - 48 hours (2 days)
   - 72 hours (3 days)

2. **Block Features**:

   - Automatic token invalidation
   - Block reason tracking
   - Block duration tracking
   - Admin-only access
   - Automatic unblocking after duration expires

3. **Security Measures**:
   - Cannot block admin users
   - All active tokens are blacklisted
   - Block history is maintained
   - Blocked users cannot access protected routes

## Security Features

1. **Token Storage:**

   - Access token stored in HTTP-only cookie
   - Refresh token stored in HTTP-only cookie
   - Secure flag enabled in production
   - SameSite: strict to prevent CSRF

2. **Password Security:**

   - Password history tracking
   - Password reuse prevention
   - Account locking after 5 failed attempts
   - 24-hour lock duration

3. **Email Verification:**

   - Required for account activation
   - 6-digit verification code
   - Verification link with code

4. **OTP System:**
   - 6-digit OTP
   - 5-minute expiration
   - SMS delivery

## Error Responses

All endpoints may return the following error responses:

```json
{
  "status": "error",
  "message": "Error message here"
}
```

Common HTTP Status Codes:

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Rate Limiting

- Login attempts: 5 per hour
- OTP requests: 3 per hour
- Password reset requests: 3 per hour
