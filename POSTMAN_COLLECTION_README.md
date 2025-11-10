# RescueWheels API Postman Collection

Complete Postman collection for RescueWheels Backend API with secure authentication system.

## 📦 Import Instructions

1. **Import Collection:**
   - Open Postman
   - Click "Import" button
   - Select `RescueWheels_API.postman_collection.json`
   - Click "Import"

2. **Import Environment (Optional but Recommended):**
   - Click "Import" button
   - Select `RescueWheels_API.postman_environment.json`
   - Click "Import"
   - Select "RescueWheels API Environment" from the environment dropdown

## 🔧 Environment Variables

The collection uses the following variables:

- `base_url` - API base URL (default: `http://localhost:5000`)
- `access_token` - JWT access token (auto-filled after login)
- `refresh_token` - JWT refresh token (auto-filled after login)
- `reset_token` - Password reset token (from email)
- `user_id` - User ID for admin operations

## 📋 API Endpoints

### Health Check
- **GET** `/` - Server status
- **GET** `/api/test-cors` - Test CORS configuration

### Authentication
- **POST** `/api/auth/register` - Register new user
- **POST** `/api/auth/login` - Login with email/phone and password
- **GET** `/api/auth/verify-email` - Verify email with code
- **POST** `/api/auth/forgot-password` - Request password reset
- **POST** `/api/auth/reset-password` - Reset password with token
- **POST** `/api/auth/refresh-token` - Refresh access token
- **GET** `/api/auth/profile` - Get user profile (Protected)
- **POST** `/api/auth/logout` - Logout and blacklist token (Protected)

### Two-Factor Authentication
- **POST** `/api/auth/setup-2fa` - Setup 2FA (Protected)
- **POST** `/api/auth/verify-2fa-setup` - Verify and activate 2FA (Protected)
- **POST** `/api/auth/enable-2fa` - Enable 2FA (Protected)
- **POST** `/api/auth/disable-2fa` - Disable 2FA (Protected)
- **POST** `/api/auth/verify-2fa` - Verify 2FA token during login

### Admin
- **GET** `/api/admin/blocked-users` - Get blocked users (Admin/SuperAdmin)
- **POST** `/api/admin/block-user/:userId` - Block a user (Admin)
- **POST** `/api/admin/unblock-user/:userId` - Unblock a user (Admin)

## 🚀 Quick Start Guide

### 1. Register a New User
```
POST /api/auth/register
Body:
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+923001234567",
  "password": "SecurePass123!",
  "role": "user"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Phone Format:** `+923XXXXXXXXX` (Pakistan format)

### 2. Verify Email
Check your email for verification code, then:
```
GET /api/auth/verify-email?email=john.doe@example.com&code=123456
```

### 3. Login
```
POST /api/auth/login
Body:
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
- If 2FA is disabled: Returns tokens in cookies and response
- If 2FA is enabled: Returns `2fa_required` status

### 4. Setup 2FA (Optional)
```
POST /api/auth/setup-2fa
Headers:
  Authorization: Bearer {access_token}
```

**Response includes:**
- QR code (base64 image)
- Secret key (for manual entry)

Scan QR code with authenticator app (Google Authenticator, Authy, etc.)

### 5. Verify 2FA Setup
```
POST /api/auth/verify-2fa-setup
Headers:
  Authorization: Bearer {access_token}
Body:
{
  "token": "123456"
}
```

### 6. Login with 2FA Enabled
1. First, login normally (returns `2fa_required`)
2. Then verify 2FA token:
```
POST /api/auth/verify-2fa
Body:
{
  "email": "john.doe@example.com",
  "token": "123456"
}
```

## 🔐 Authentication

Most endpoints require authentication via Bearer token:

```
Authorization: Bearer {access_token}
```

Tokens are automatically set in cookies after login. You can also manually set the `access_token` variable in Postman.

## 📝 Request Examples

### Register User
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+923001234567",
  "password": "SecurePass123!",
  "role": "user"
}
```

### Login
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

### Reset Password
```json
{
  "password": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

### Block User (Admin)
```json
{
  "reason": "Violation of terms of service",
  "duration": 24
}
```

## ⚠️ Important Notes

1. **Rate Limiting:**
   - Login: 5 attempts per 24 hours
   - Register: 3 attempts per hour
   - Forgot Password: 3 attempts per hour

2. **Token Expiration:**
   - Access Token: 15 minutes (default)
   - Refresh Token: 7 days (default)

3. **Password History:**
   - System keeps last 5 passwords
   - Cannot reuse previous passwords

4. **Account Locking:**
   - Account locks after 5 failed login attempts
   - Lock duration: 24 hours

5. **2FA:**
   - Once enabled, 2FA is mandatory for login
   - Use authenticator app to generate 6-digit codes

## 🐛 Troubleshooting

### CORS Errors
- Ensure your origin is in the allowed list:
  - `http://localhost:3000`
  - `http://localhost:3001`
  - `http://localhost:8080`

### Token Expired
- Use `/api/auth/refresh-token` endpoint
- Or login again

### 2FA Token Invalid
- Ensure device time is synchronized
- Use current 6-digit code from authenticator app
- Token expires every 30 seconds

## 📧 Support

For issues or questions, check the server logs or contact support.

