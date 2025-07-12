# 🔐 Two-Factor Authentication (2FA) API Documentation

## Overview

The Two-Factor Authentication (2FA) system adds an extra layer of security to user accounts using Time-based One-Time Passwords (TOTP). This implementation uses the `speakeasy` library for TOTP generation and `qrcode` for QR code generation.

## 🔧 Technologies Used

- **speakeasy**: TOTP generation and verification
- **qrcode**: QR code generation for easy setup
- **Base32 encoding**: For secret storage

## 🔑 How 2FA Works

### Login Flow with 2FA

**When `is2FaActivated = false` (2FA Disabled):**
1. User logs in with email/phone + password
2. If credentials are correct → **Direct login successful**

**When `is2FaActivated = true` (2FA Enabled):**
1. User logs in with email/phone + password
2. If credentials are correct → **2FA token required**
3. User enters 6-digit code from authenticator app
4. If 2FA token is valid → **Login completed**

### Setup Flow
1. **Setup**: User initiates 2FA setup → QR code generated (always new secret) → User scans with authenticator app
2. **Verification**: User enters 6-digit code → Code verified → 2FA activated
3. **Enable/Disable**: Users can enable or disable 2FA as needed

## 🌐 Base URL

```
http://localhost:5000/api/auth
```

---

## 📋 2FA API Endpoints

### 1. Setup 2FA

Initiate the 2FA setup process by generating a new secret and QR code (overwrites any previous secret).

```http
POST /api/auth/setup-2fa
Authorization: Bearer {token}
```

#### 🔐 **Access Control**
- **Required:** Valid JWT token
- **User must be logged in**

#### ✅ **Success Response**

**Status Code:** `200 OK`

```json
{
  "status": "success",
  "message": "2FA setup initiated",
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "secret": "JBSWY3DPEHPK3PXP",
    "manualEntryKey": "JBSWY3DPEHPK3PXP"
  }
}
```

#### 📱 **QR Code Usage**

1. **Scan QR Code**: Use any authenticator app (Google Authenticator, Authy, etc.)
2. **Manual Entry**: If QR code doesn't work, manually enter the secret key
3. **App Setup**: The app will generate 6-digit codes every 30 seconds

#### ❌ **Error Responses**

**Status Code:** `400 Bad Request`
```json
{
  "status": "error",
  "message": "2FA is already activated for this account."
}
```

**Status Code:** `401 Unauthorized`
```json
{
  "status": "error",
  "message": "No token provided"
}
```

---

### 2. Verify 2FA Setup

Verify the 2FA setup by entering a code from the authenticator app. **Only send `{ "token": "xxxxxx" }` in the body.**

```http
POST /api/auth/verify-2fa-setup
Authorization: Bearer {token}
Content-Type: application/json

{
    "token": "123456"
}
```

#### 🔐 **Access Control**
- **Required:** Valid JWT token
- **User must have initiated 2FA setup**

#### 📝 **Request Body**

| Parameter | Type   | Required | Description                    |
| --------- | ------ | -------- | ------------------------------ |
| `token`   | string | Yes      | 6-digit code from authenticator |

#### ✅ **Success Response**

**Status Code:** `200 OK`

```json
{
  "status": "success",
  "message": "2FA has been activated successfully!"
}
```

#### ❌ **Error Responses**

**Status Code:** `400 Bad Request`
```json
{
  "status": "error",
  "message": "Invalid or expired 2FA token. Please check your authenticator app and try again. If the problem persists, re-scan the QR code."
}
```

**Status Code:** `400 Bad Request`
```json
{
  "status": "error",
  "message": "2FA setup not initiated. Please setup 2FA first."
}
```

---

### 3. Enable 2FA

Enable 2FA if it was previously disabled.

```http
POST /api/auth/enable-2fa
Authorization: Bearer {token}
```

#### 🔐 **Access Control**
- **Required:** Valid JWT token
- **User must be logged in**

#### ✅ **Success Response**

**Status Code:** `200 OK`

```json
{
  "status": "success",
  "message": "2FA has been enabled successfully!"
}
```

#### ❌ **Error Responses**

**Status Code:** `400 Bad Request`
```json
{
  "status": "error",
  "message": "2FA is already enabled"
}
```

---

### 4. Disable 2FA

Disable 2FA and remove the secret from the account.

```http
POST /api/auth/disable-2fa
Authorization: Bearer {token}
```

#### 🔐 **Access Control**
- **Required:** Valid JWT token
- **User must be logged in**

#### ✅ **Success Response**

**Status Code:** `200 OK`

```json
{
  "status": "success",
  "message": "2FA has been disabled successfully!"
}
```

#### ❌ **Error Responses**

**Status Code:** `400 Bad Request`
```json
{
  "status": "error",
  "message": "2FA is not enabled for this account"
}
```

---

### 5. Verify 2FA Token (Login) - MANDATORY when 2FA is enabled

**This endpoint is MANDATORY when `is2FaActivated = true`.** After successful login with email/phone + password, if 2FA is enabled, users MUST call this endpoint to complete the login process.

```http
POST /api/auth/verify-2fa
Content-Type: application/json

{
    "email": "user@example.com",
    "token": "123456"
}
```

#### 📝 **Request Body**

| Parameter | Type   | Required | Description                    |
| --------- | ------ | -------- | ------------------------------ |
| `email`   | string | Yes      | User's email address           |
| `token`   | string | Yes      | 6-digit code from authenticator |

#### ✅ **Success Response**

**Status Code:** `200 OK`

```json
{
  "status": "success",
  "message": "Two-factor authentication verified successfully. Login completed.",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+923001234567",
    "role": "user",
    "is2FaActivated": true
  }
}
```

#### ❌ **Error Responses**

**Status Code:** `400 Bad Request`
```json
{
  "status": "error",
  "message": "Both email and 2FA token are required."
}
```

**Status Code:** `400 Bad Request`
```json
{
  "status": "error",
  "message": "2FA token must be a 6-digit number."
}
```

**Status Code:** `400 Bad Request`
```json
{
  "status": "error",
  "message": "Two-factor authentication is not enabled for this account."
}
```

**Status Code:** `400 Bad Request`
```json
{
  "status": "error",
  "message": "Invalid 2FA token. Please check your authenticator app and try again."
}
```

**Status Code:** `404 Not Found`
```json
{
  "status": "error",
  "message": "User not found."
}
```

---

### 6. Debug 2FA (Development Only)

Get debug information for 2FA testing. **Remove this endpoint in production.**

```http
GET /api/auth/debug-2fa
Authorization: Bearer {token}
```

#### 🔐 **Access Control**
- **Required:** Valid JWT token
- **User must be logged in**

#### ✅ **Success Response**

**Status Code:** `200 OK`

```json
{
  "status": "success",
  "message": "Debug information for 2FA",
  "data": {
    "email": "user@example.com",
    "hasSecret": true,
    "secretLength": 16,
    "secretPreview": "JBSWY3DPEHP...",
    "isActivated": true,
    "currentToken": "123456",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

---

## 🔄 Complete Login Flow Examples

### Example 1: Login with 2FA Disabled

```javascript
// Step 1: Login
const loginResponse = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@example.com', password: 'password123' })
});

const loginData = await loginResponse.json();

if (loginData.status === 'success') {
    console.log('Login successful! 2FA not required.');
    // User is now logged in
}
```

### Example 2: Login with 2FA Enabled

```javascript
// Step 1: Initial login
const loginResponse = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@example.com', password: 'password123' })
});

const loginData = await loginResponse.json();

if (loginData.status === '2fa_required') {
    // Step 2: 2FA verification (MANDATORY)
    const token = prompt('Enter your 2FA token:');
    
    const verifyResponse = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            email: 'user@example.com', 
            token: token 
        })
    });
    
    const verifyData = await verifyResponse.json();
    
    if (verifyData.status === 'success') {
        console.log('Login successful! 2FA verified.');
        // User is now logged in
    }
}
```

---

## ⚠️ Important Notes

1. **Mandatory 2FA Verification**: When `is2FaActivated = true`, users MUST complete 2FA verification to login. There is no way to bypass this.

2. **Token Format**: 2FA tokens must be exactly 6 digits (0-9).

3. **Time Window**: Tokens are valid for 30 seconds. Ensure your device time is synchronized.

4. **Secret Security**: The 2FA secret is stored in base32 format and should never be exposed to users.

5. **Debug Endpoint**: The debug endpoint should be removed in production environments.

6. **Error Handling**: Always handle both `success` and `error` responses from the API.

---

## 🧪 Testing

Use the provided `test-2fa-flow.js` script to test the complete 2FA login flow:

```bash
node test-2fa-flow.js
```

This script demonstrates:
- Login with 2FA disabled
- Login with 2FA enabled (two-step process)
- Invalid token handling 