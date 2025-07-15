# 🔐 Admin API Documentation

## Overview

The Admin API provides comprehensive user management capabilities for administrators and moderators. This API allows authorized users to view, block, and unblock users in the system.

## 🔑 Authentication

All Admin API endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer your_jwt_token
```

## 👥 Role-Based Access Control

| Role      | Permissions                                                                                |
| --------- | ------------------------------------------------------------------------------------------ |
| admin     | ✅ Full access to all admin endpoints<br>✅ Can block/unblock users<br>✅ Can view all blocked users |
| moderator | ✅ Can view blocked users<br>❌ Cannot block/unblock users<br>❌ Limited administrative access |
| user      | ❌ No access to admin endpoints                                                            |

## 🌐 Base URL

```
http://localhost:5000/api/admin
```

---

## 📋 API Endpoints

### 1. Get Blocked Users

Retrieve a paginated list of all blocked users in the system.

```http
GET /api/admin/blocked-users
```

#### 🔐 **Access Control**
- **Required Roles:** `admin` or `moderator`

#### 📝 **Query Parameters**

| Parameter | Type    | Default | Description                                    |
| --------- | ------- | ------- | ---------------------------------------------- |
| `page`    | number  | 1       | Page number for pagination                     |
| `limit`   | number  | 10      | Number of users per page (max: 50)            |
| `role`    | string  | -       | Filter by user role (user, vendor, admin)      |

#### 📋 **Request Examples**

```bash
# Get all blocked users (first page)
GET /api/admin/blocked-users

# Get blocked users with pagination
GET /api/admin/blocked-users?page=2&limit=5

# Filter by role
GET /api/admin/blocked-users?role=user

# Combined filters
GET /api/admin/blocked-users?page=1&limit=10&role=admin
```

#### ✅ **Success Response**

**Status Code:** `200 OK`

```json
{
  "status": "success",
  "message": "Found 3 blocked users",
  "data": {
    "users": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user",
        "blockReason": "Violation of terms of service",
        "blockExpiresAt": "2024-01-15T10:00:00.000Z",
        "blockedAt": "2024-01-10T10:00:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "role": "vendor",
        "blockReason": "Suspicious activity detected",
        "blockExpiresAt": "2024-01-20T10:00:00.000Z",
        "blockedAt": "2024-01-12T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalUsers": 15
    }
  }
}
```

#### 🎉 **Empty Response**

**Status Code:** `200 OK`

```json
{
  "status": "success",
  "message": "🎉 No users are currently blocked in the system"
}
```

#### ❌ **Error Responses**

**Status Code:** `401 Unauthorized`
```json
{
  "status": "error",
  "message": "Access denied. Admin privileges required."
}
```

**Status Code:** `500 Internal Server Error**
```json
{
  "status": "error",
  "message": "Failed to fetch blocked users",
  "error": "Internal server error"
}
```

---

### 2. Block User

Manually block a user for a specified duration with a reason.

```http
POST /api/admin/block-user/:userId
```

#### 🔐 **Access Control**
- **Required Role:** `admin` only

#### 📝 **Path Parameters**

| Parameter | Type   | Description           |
| --------- | ------ | --------------------- |
| `userId`  | string | ID of the user to block |

#### 📝 **Request Body**

```json
{
  "reason": "string",     // Required: Reason for blocking
  "duration": "number"    // Optional: Duration in hours (default: 24)
}
```

#### 📋 **Request Examples**

```bash
# Block user for 24 hours (default)
curl -X POST /api/admin/block-user/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Violation of community guidelines"
  }'

# Block user for specific duration
curl -X POST /api/admin/block-user/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Suspicious activity",
    "duration": 48
  }'
```

#### ✅ **Success Response**

**Status Code:** `200 OK`

```json
{
  "status": "success",
  "message": "User has been blocked successfully"
}
```

#### ❌ **Error Responses**

**Status Code:** `400 Bad Request**
```json
{
  "status": "error",
  "message": "User is not blocked"
}
```

**Status Code:** `404 Not Found**
```json
{
  "status": "error",
  "message": "User not found"
}
```

**Status Code:** `403 Forbidden**
```json
{
  "status": "error",
  "message": "Access denied. Admin privileges required."
}
```

---

### 3. Unblock User

Remove the block from a previously blocked user.

```http
POST /api/admin/unblock-user/:userId
```

#### 🔐 **Access Control**
- **Required Role:** `admin` only

#### 📝 **Path Parameters**

| Parameter | Type   | Description             |
| --------- | ------ | ----------------------- |
| `userId`  | string | ID of the user to unblock |

#### 📋 **Request Examples**

```bash
# Unblock a user
curl -X POST /api/admin/unblock-user/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer your_token"
```

#### ✅ **Success Response**

**Status Code:** `200 OK`

```json
{
  "status": "success",
  "message": "User has been unblocked successfully"
}
```

#### ❌ **Error Responses**

**Status Code:** `400 Bad Request**
```json
{
  "status": "error",
  "message": "User is not blocked"
}
```

**Status Code:** `404 Not Found**
```json
{
  "status": "error",
  "message": "User not found"
}
```

---

## 🔧 Implementation Examples

### JavaScript/Node.js

```javascript
// Get blocked users
const getBlockedUsers = async (token, page = 1, limit = 10) => {
  const response = await fetch(`/api/admin/blocked-users?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
};

// Block a user
const blockUser = async (token, userId, reason, duration = 24) => {
  const response = await fetch(`/api/admin/block-user/${userId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason, duration })
  });
  return await response.json();
};

// Unblock a user
const unblockUser = async (token, userId) => {
  const response = await fetch(`/api/admin/unblock-user/${userId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
};
```

### Python

```python
import requests

# Get blocked users
def get_blocked_users(token, page=1, limit=10):
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    response = requests.get(
        f'/api/admin/blocked-users?page={page}&limit={limit}',
        headers=headers
    )
    return response.json()

# Block a user
def block_user(token, user_id, reason, duration=24):
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    data = {'reason': reason, 'duration': duration}
    response = requests.post(
        f'/api/admin/block-user/{user_id}',
        headers=headers,
        json=data
    )
    return response.json()

# Unblock a user
def unblock_user(token, user_id):
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    response = requests.post(
        f'/api/admin/unblock-user/{user_id}',
        headers=headers
    )
    return response.json()
```

### cURL Examples

```bash
# Get blocked users
curl -X GET "http://localhost:5000/api/admin/blocked-users?page=1&limit=10" \
  -H "Authorization: Bearer your_jwt_token"

# Block a user
curl -X POST "http://localhost:5000/api/admin/block-user/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Violation of terms",
    "duration": 24
  }'

# Unblock a user
curl -X POST "http://localhost:5000/api/admin/unblock-user/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer your_jwt_token"
```

---

## 🚨 Error Handling

### Common Error Codes

| Status Code | Description                    | Possible Causes                                    |
| ----------- | ------------------------------ | -------------------------------------------------- |
| 400         | Bad Request                    | Invalid parameters, user already blocked/unblocked |
| 401         | Unauthorized                   | Missing or invalid JWT token                       |
| 403         | Forbidden                      | Insufficient role permissions                      |
| 404         | Not Found                      | User ID doesn't exist                              |
| 500         | Internal Server Error          | Database connection issues, server errors          |

### Error Response Format

```json
{
  "status": "error",
  "message": "Human-readable error message",
  "error": "Technical error details (development only)"
}
```

---

## 🔒 Security Considerations

1. **JWT Token Validation**: All requests must include a valid JWT token
2. **Role-Based Access**: Endpoints are protected by role-based middleware
3. **Input Validation**: All inputs are validated and sanitized
4. **Rate Limiting**: API endpoints are protected by rate limiting
5. **Audit Trail**: All admin actions are logged for security purposes

---

## 📊 Response Data Structure

### User Object
```json
{
  "_id": "string",           // MongoDB ObjectId
  "name": "string",          // User's full name
  "email": "string",         // User's email address
  "role": "string",          // User role (user, vendor, admin, moderator)
  "blockReason": "string",   // Reason for blocking
  "blockExpiresAt": "date",  // When the block expires
  "blockedAt": "date"        // When the user was blocked
}
```

### Pagination Object
```json
{
  "currentPage": "number",   // Current page number
  "totalPages": "number",    // Total number of pages
  "totalUsers": "number"     // Total number of blocked users
}
```

---

## 🎯 Best Practices

1. **Always check response status** before processing data
2. **Handle pagination properly** for large datasets
3. **Use appropriate error handling** for different scenarios
4. **Cache frequently accessed data** when possible
5. **Log admin actions** for audit purposes
6. **Validate user permissions** before performing actions

---

## 📞 Support

For technical support or questions about the Admin API:

- **Email**: admin-support@example.com
- **Documentation**: [Main API Docs](./API_DOCS.md)
- **GitHub Issues**: [Report Issues](https://github.com/your-repo/issues)

---

*Last updated: January 2024*
*Version: 1.0.0* 