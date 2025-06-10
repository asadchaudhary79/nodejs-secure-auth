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
- 📱 Phone Number Verification (OTP)
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

### Admin Endpoints

#### Get Blocked Users

```http
GET /api/admin/blocked-users
Authorization: Bearer {token}
```

**Access Control:**

- Required Roles: `admin` or `moderator`

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

#### Block User

```http
POST /api/admin/block-user/:userId
Authorization: Bearer {token}
Content-Type: application/json

{
    "reason": "string",
    "duration": "number" // Duration in hours (optional)
}
```

**Access Control:**

- Required Role: `admin` only

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

#### Unblock User

```http
POST /api/admin/unblock-user/:userId
Authorization: Bearer {token}
```

**Access Control:**

- Required Role: `admin` only

**Response:**

```json
{
  "status": "success",
  "message": "User unblocked successfully"
}
```

## Role-Based Access Control

The API implements role-based access control (RBAC) with the following roles:

| Role      | Permissions                                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| admin     | - Full access to all endpoints<br>- Can block/unblock users<br>- Can view all blocked users<br>- Can manage all system settings |
| moderator | - Can view blocked users<br>- Cannot block/unblock users<br>- Limited administrative access                                     |
| user      | - Basic user access<br>- Cannot access administrative endpoints                                                                 |

## Security Features

1. JWT-based Authentication
2. Role-based Access Control
3. Rate Limiting
4. Account Lockout
5. Secure Password Reset
6. Email Verification
7. Phone Number Verification
8. Session Management
9. Token Blacklisting
10. Security Headers (Helmet)

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

## Contact

Your Name - [@your_twitter](https://twitter.com/your_twitter)

Project Link: [https://github.com/asadchaudhary79/nodejs-secure-auth](https://github.com/asadchaudhary79/nodejs-secure-auth)
