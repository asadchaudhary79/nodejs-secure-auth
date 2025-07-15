# NodeJS Secure Authentication Backend

A secure, role-based authentication system built with Node.js, Express, and MongoDB. This backend provides a robust authentication system with role-based access control (RBAC), email verification, user management features, and optional Two-Factor Authentication (2FA) using TOTP.

## 🚀 Features

- 🔐 **Secure Authentication** with JWT tokens
- 👥 **Role-Based Access Control (RBAC)** - User and Admin roles
- 📧 **Email Verification System** with verification codes
- 🔄 **Token Refresh Mechanism** for seamless sessions
- 🔒 **Account Security Features**
  - Account lockout after failed attempts
  - Secure password reset via email
  - Session management with token blacklisting
- 👮‍♂️ **Admin Dashboard Features**
  - User management and monitoring
  - Block/unblock users
  - View blocked users list
- 🛡️ **Two-Factor Authentication (2FA)** with TOTP support
- 🌐 **CORS Support** for cross-origin requests
- 🍪 **Secure Cookie Management** with HTTP-only cookies

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Email Service:** Nodemailer with SMTP
- **Security:** 
  - Express Rate Limit for brute force protection
  - Helmet for security headers
  - bcrypt for password hashing
- **2FA:** speakeasy and qrcode for TOTP implementation
- **Validation:** Express-validator for input validation

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- SMTP Server (for email functionality)
- Git

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/asadchaudhary79/nodejs-secure-auth.git
cd nodejs-secure-auth
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Client Configuration
CLIENT_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

# Database
MONGO_URI=mongodb://localhost:27017/secure-auth

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_2024_high_entropy_string
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_token_secret_2024_unique_string
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration (SMTP)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDER_VERIFICATION_EMAIL=your_verify_email@domain.com
EMAIL_APP_PASSWORD=your_email_app_password
SENDGRID_FROM_NAME=Your App Name

# Admin Configuration
ADMIN_USERNAME=admin_username
ADMIN_EMAIL=admin@domain.com
```

### 4. Database Setup

Ensure MongoDB is running and accessible. The application will automatically create the necessary collections.

### 5. Create Admin User (Optional)

Run the admin creation script:

```bash
node scripts/createAdmin.js
```

### 6. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer your_jwt_token
```

### 🔐 Authentication Endpoints

#### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "password": "securePassword123",
    "role": "user" (optional, defaults to "user")
}
```

**Response:**
```json
{
  "status": "success",
  "message": "User registered. Please verify your email."
}
```

**Note:** A verification email will be sent with a verification code and link.

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
    "email": "john@example.com" (or "phone": "+1234567890"),
    "password": "securePassword123"
}
```

**Response (2FA Disabled):**
```json
{
  "status": "success",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Response (2FA Enabled):**
```json
{
  "status": "2fa_required",
  "message": "2FA verification required"
}
```

**Note:**
- Sets HTTP-only cookies: `token` (15 min) and `refreshToken` (7 days)
- Cookies are secure in production and SameSite: strict
- If 2FA is enabled, cookies are only set after successful 2FA verification

#### Verify Email

```http
GET /api/auth/verify-email?email=john@example.com&code=123456
```

**Response:**
```json
{
  "status": "success",
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
  "status": "success",
  "message": "Logged out successfully"
}
```

**Note:** Clears cookies and blacklists the current token.

#### Refresh Token

```http
POST /api/auth/refresh-token
Content-Type: application/json

{
    "refreshToken": "string" // Optional if sent as cookie
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Token refreshed successfully"
}
```

#### Forgot Password

```http
POST /api/auth/forgot-password
Content-Type: application/json

{
    "email": "john@example.com"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Password reset email sent"
}
```

#### Reset Password

```http
POST /api/auth/reset-password
Content-Type: application/json
Authorization: Bearer {token}

{
    "password": "newSecurePassword123",
    "confirmPassword": "newSecurePassword123"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Password reset successful"
}
```

#### Get User Profile

```http
GET /api/auth/profile
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "role": "user",
    "isEmailVerified": true,
    "twoFactorEnabled": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 🛡️ Two-Factor Authentication (2FA)

2FA adds an extra layer of security using Time-based One-Time Passwords (TOTP).

#### 2FA Setup Flow

1. **Setup 2FA:**
   ```http
   POST /api/auth/setup-2fa
   Authorization: Bearer {token}
   ```
   
   **Response:**
   ```json
   {
     "status": "success",
     "data": {
       "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
       "secret": "JBSWY3DPEHPK3PXP"
     }
   }
   ```

2. **Verify 2FA Setup:**
   ```http
   POST /api/auth/verify-2fa-setup
   Authorization: Bearer {token}
   Content-Type: application/json
   
   {
     "token": "123456"
   }
   ```

3. **Enable 2FA:**
   ```http
   POST /api/auth/enable-2fa
   Authorization: Bearer {token}
   ```

#### 2FA Login Flow

1. **Login** with email/phone and password
2. If 2FA is enabled, you'll receive `status: "2fa_required"`
3. **Verify 2FA:**
   ```http
   POST /api/auth/verify-2fa
   Content-Type: application/json
   
   {
     "email": "john@example.com",
     "token": "123456"
   }
   ```

#### 2FA Management

- **Disable 2FA:** `POST /api/auth/disable-2fa` (requires JWT token)
- **Debug 2FA:** `POST /api/auth/debug-2fa` (shows current valid token)

#### 2FA Troubleshooting

- Ensure your device time is synchronized
- Remove old entries from your authenticator app before scanning new QR codes
- Use the debug endpoint to verify the expected token
- Make sure you're using the latest QR code after setup

#### More Details

See the full 2FA API documentation for all endpoints, request/response examples, and troubleshooting:

📋 **[2FA API Documentation](./2FA_API_DOCS.md)**

### 👮‍♂️ Admin API

For comprehensive admin functionality including user management, blocking/unblocking users, and administrative controls, please refer to the dedicated Admin API documentation:

📋 **[Admin API Documentation](./ADMIN_API_DOCS.md)**

## 🔒 Security Features

1. **JWT-based Authentication** with short-lived tokens
2. **Role-based Access Control** with user and admin roles
3. **Rate Limiting** to prevent brute force attacks
4. **Account Lockout** after multiple failed login attempts
5. **Secure Password Reset** via email verification
6. **Email Verification** for new user accounts
7. **Session Management** with token blacklisting
8. **Security Headers** via Helmet middleware
9. **CORS Protection** with configurable origins
10. **Two-Factor Authentication** with TOTP support
11. **HTTP-only Cookies** for secure token storage
12. **Input Validation** and sanitization

## 🚨 Error Handling

The API uses a consistent error response format:

```json
{
  "status": "error",
  "message": "Error description"
}
```

### Common HTTP Status Codes

- **200:** Success
- **201:** Created
- **400:** Bad Request (validation errors)
- **401:** Unauthorized (invalid/missing token)
- **403:** Forbidden (insufficient permissions)
- **404:** Not Found
- **429:** Too Many Requests (rate limited)
- **500:** Internal Server Error

## 🧪 Testing

### Test CORS Configuration

```bash
curl -X GET http://localhost:5000/api/test-cors \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type"
```

### Test Login Endpoint

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 📁 Project Structure

```
SecureAuth-nodejs/
├── config/                 # Configuration files
│   ├── dbConfig.js        # Database configuration
│   └── emailConfig.js     # Email service configuration
├── controllers/           # Route controllers
│   ├── adminController.js # Admin functionality
│   └── authController.js  # Authentication logic
├── middlewares/          # Express middlewares
│   ├── authMiddleware.js # JWT authentication
│   ├── errorMiddleware.js # Error handling
│   └── securityMiddleware.js # Security features
├── models/               # Database models
│   ├── BlacklistedToken.js # Token blacklist
│   └── User.js          # User model
├── routes/               # API routes
│   ├── adminRoutes.js   # Admin endpoints
│   └── authRoutes.js    # Authentication endpoints
├── services/            # Business logic
│   ├── emailService.js  # Email functionality
│   └── emailTemplates/  # Email templates
├── utils/               # Utility functions
│   ├── encrypt.js       # Encryption utilities
│   └── jwt.js          # JWT utilities
├── scripts/             # Utility scripts
│   └── createAdmin.js   # Admin user creation
├── app.js              # Express app configuration
├── server.js           # Server entry point
└── package.json        # Dependencies and scripts
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Add appropriate error handling
- Include input validation
- Write clear commit messages
- Test your changes thoroughly

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the troubleshooting sections in the documentation
2. Review the error logs
3. Ensure all environment variables are properly configured
4. Verify database connectivity
5. Check email service configuration

## 🔄 Changelog

### Recent Updates
- Enhanced CORS configuration for cross-origin requests
- Improved 2FA implementation with better error handling
- Added comprehensive API documentation
- Enhanced security middleware
- Improved error handling and validation

---

**Built with ❤️ for secure authentication**


