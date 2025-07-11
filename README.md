# NodeJS Secure Authentication Backend

A secure, role-based authentication system built with Node.js, Express, and MongoDB. This backend provides a robust authentication system with role-based access control (RBAC), email verification, and user management features.

## Features

- 🔐 Secure Authentication with JWT
- 👥 Role-Based Access Control (RBAC)
- 📧 Email Verification System
- 🔄 Token Refresh Mechanism
- 🔒 Account Security Features
  - Account Lockout
  - Password Reset
  - Session Management
- 👮‍♂️ Admin Dashboard Features
  - User Management
  - Block/Unblock Users
  - View Blocked Users

## Tech Stack

- Node.js
- Express.js
- MongoDB
- JWT for Authentication
- Nodemailer for Email Service
- Express Rate Limit for Security
- Helmet for Security Headers

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- SMTP Server (for email functionality)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/asadchaudhary79/nodejs-secure-auth.git
cd nodejs-secure-auth
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory:

```env
PORT=3000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_email
SMTP_PASS=your_smtp_password
```

4. Start the server:

```bash
npm start
```

## API Documentation

### Authentication

All API requests require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer your_jwt_token
```

### Base URL

```
http://localhost:3000/api
```

### Authentication Endpoints

#### Register User

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

#### Login

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

#### Verify Email

```http
GET /api/auth/verify-email?email={email}&code={code}
```

**Response:**

```json
{
  "message": "Email verified successfully"
}
```

#### Logout

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

#### Refresh Token

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

#### Forgot Password

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

#### Reset Password

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

#### Get User Profile

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

### Admin API

For comprehensive admin functionality including user management, blocking/unblocking users, and administrative controls, please refer to the dedicated Admin API documentation:

📋 **[Admin API Documentation](./ADMIN_API_DOCS.md)**

## Security Features

1. JWT-based Authentication
2. Role-based Access Control
3. Rate Limiting
4. Account Lockout
5. Secure Password Reset
6. Email Verification
7. Session Management
8. Token Blacklisting
9. Security Headers (Helmet)

## Error Handling

The API uses a consistent error response format:

```json
{
  "status": "error",
  "message": "Error description"
}
```

Common HTTP Status Codes:

- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.


