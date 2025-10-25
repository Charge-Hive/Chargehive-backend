# ChargeHive API Documentation

**Base URL:** `http://localhost:3000/api`
**Version:** 1.0
**Interactive Docs:** `http://localhost:3000/api/docs` (Swagger UI)

---

DEV ENDPOINT IN HEROKU - https://chargehive-backend-dev-c567e0fd7ba7.herokuapp.com/

## Table of Contents

1. [Authentication](#authentication)
2. [Provider APIs](#provider-apis)
3. [User APIs](#user-apis)
4. [Services APIs](#services-apis)
5. [Sessions APIs](#sessions-apis)
6. [Error Responses](#error-responses)

---

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## Provider APIs

### 1. Provider Signup

**Endpoint:** `POST /api/provider/signup`
**Description:** Register a new provider account with blockchain wallet
**Authentication:** Not required

**Request Body:**

```json
{
  "email": "provider@example.com",
  "password": "SecurePass123!",
  "name": "John's Parking",
  "phone": "+1234567890",
  "businessName": "John's EV Charging Station"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "provider": {
      "id": "uuid-here",
      "email": "provider@example.com",
      "name": "John's Parking",
      "phone": "+1234567890",
      "businessName": "John's EV Charging Station",
      "walletAddress": "0x1234...5678"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "message": "Email already exists",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

### 2. Provider Login

**Endpoint:** `POST /api/provider/login`
**Description:** Authenticate provider and receive JWT token
**Authentication:** Not required

**Request Body:**

```json
{
  "email": "provider@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "provider": {
      "id": "uuid-here",
      "email": "provider@example.com",
      "name": "John's Parking",
      "walletAddress": "0x1234...5678"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401 Unauthorized):**

```json
{
  "message": "Invalid credentials",
  "error": "Unauthorized",
  "statusCode": 401
}
```

---

### 3. Add Service (Parking/Charging Station)

**Endpoint:** `POST /api/provider/services`
**Description:** Register a new parking spot or EV charging station
**Authentication:** Required (Provider)

**Request Headers:**

```
Authorization: Bearer <provider-jwt-token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "serviceType": "parking",
  "status": "available",
  "address": "123 Main Street",
  "city": "San Francisco",
  "state": "CA",
  "postalCode": "94102",
  "country": "USA",
  "latitude": "37.7749",
  "longitude": "-122.4194",
  "description": "Covered parking with EV charging",
  "hourlyRate": "15"
}
```

**Field Descriptions:**

- `serviceType`: "parking" or "charger"
- `status`: "available", "occupied", "maintenance"
- `hourlyRate`: Price per hour (optional, defaults to "10")
- `latitude`, `longitude`: Optional GPS coordinates

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Service registered successfully",
  "data": {
    "serviceId": "uuid-here",
    "serviceType": "parking",
    "status": "available",
    "address": "123 Main Street",
    "city": "San Francisco",
    "state": "CA",
    "postalCode": "94102",
    "country": "USA",
    "latitude": "37.7749",
    "longitude": "-122.4194",
    "createdAt": "2025-10-21T10:00:00Z"
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "message": [
    "serviceType must be one of the following values: parking, charger",
    "address should not be empty"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

---

### 4. Get Provider Profile

**Endpoint:** `GET /api/provider/profile`
**Description:** Get authenticated provider's profile
**Authentication:** Required (Provider)

**Request Headers:**

```
Authorization: Bearer <provider-jwt-token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "email": "provider@example.com",
    "name": "John's Parking",
    "phone": "+1234567890",
    "businessName": "John's EV Charging Station",
    "walletAddress": "0x1234...5678",
    "createdAt": "2025-10-20T10:00:00Z"
  }
}
```

---

## User APIs

### 1. User Registration

**Endpoint:** `POST /api/user/register`
**Description:** Register a new user account with blockchain wallet
**Authentication:** Not required

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "Jane Doe",
  "phone": "+1234567890"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "name": "Jane Doe",
      "phone": "+1234567890",
      "walletAddress": "0xabcd...efgh"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "message": "Email already exists",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

### 2. User Login

**Endpoint:** `POST /api/user/login`
**Description:** Authenticate user and receive JWT token
**Authentication:** Not required

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "name": "Jane Doe",
      "walletAddress": "0xabcd...efgh"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401 Unauthorized):**

```json
{
  "message": "Invalid credentials",
  "error": "Unauthorized",
  "statusCode": 401
}
```

---

### 3. Get User Profile

**Endpoint:** `GET /api/user/profile`
**Description:** Get authenticated user's profile
**Authentication:** Required (User)

**Request Headers:**

```
Authorization: Bearer <user-jwt-token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "email": "user@example.com",
    "name": "Jane Doe",
    "phone": "+1234567890",
    "walletAddress": "0xabcd...efgh",
    "createdAt": "2025-10-20T10:00:00Z"
  }
}
```

---

## Services APIs

### 1. Get All Services

**Endpoint:** `GET /api/services`
**Description:** Get all parking spots and EV charging stations (regardless of status)
**Authentication:** Not required (Public endpoint)

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "serviceId": "uuid-1",
      "serviceType": "parking",
      "status": "available",  // Can be: available, occupied, maintenance, or null
      "address": "123 Main Street",
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94102",
      "country": "USA",
      "latitude": "37.7749",
      "longitude": "-122.4194",
      "hourlyRate": "15",
      "description": "Covered parking with security",
      "image1": "https://...",
      "image2": "https://...",
      "image3": null,
      "createdAt": "2025-10-21T10:00:00Z"
    },
    {
      "serviceId": "uuid-2",
      "serviceType": "charger",
      "status": "available",
      "address": "456 Oak Avenue",
      "city": "Los Angeles",
      "state": "CA",
      "postalCode": "90001",
      "country": "USA",
      "latitude": "34.0522",
      "longitude": "-118.2437",
      "hourlyRate": "20",
      "description": "Fast DC charging",
      "image1": "https://...",
      "image2": null,
      "image3": null,
      "createdAt": "2025-10-21T11:00:00Z"
    }
  ]
}
```

**Note:** Returns all services regardless of status. The frontend should filter by status if needed.

---

## Sessions APIs

### 1. Book a Session

**Endpoint:** `POST /api/sessions/book`
**Description:** Book a parking or charging session. Automatically checks for overlapping bookings and calculates total amount based on duration and hourly rate.
**Authentication:** Required (User)

**Request Headers:**

```
Authorization: Bearer <user-jwt-token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "serviceId": "550e8400-e29b-41d4-a716-446655440000",
  "fromDatetime": "2025-10-21T10:00:00Z",
  "toDatetime": "2025-10-21T12:00:00Z"
}
```

**Field Descriptions:**

- `serviceId`: UUID of the service (parking/charging station) to book
- `fromDatetime`: Start date and time (ISO 8601 format, UTC)
- `toDatetime`: End date and time (ISO 8601 format, UTC)

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Session booked successfully",
  "data": {
    "sessionId": "uuid-here",
    "userId": "user-uuid",
    "providerId": "provider-uuid",
    "serviceId": "550e8400-e29b-41d4-a716-446655440000",
    "fromDatetime": "2025-10-21T10:00:00Z",
    "toDatetime": "2025-10-21T12:00:00Z",
    "totalAmount": "30.00",
    "createdAt": "2025-10-21T09:00:00Z"
  }
}
```

**Calculation Example:**

- Duration: 2 hours (10:00 AM - 12:00 PM)
- Hourly Rate: $15/hour
- Total Amount: 2 × $15 = **$30.00**

**Error Response - Time Overlap (400 Bad Request):**

```json
{
  "message": "This service is already booked for the selected time slot. Please choose a different time.",
  "error": "Bad Request",
  "statusCode": 400
}
```

**Error Response - Service Unavailable (400 Bad Request):**

```json
{
  "message": "Service is not available for booking. Current status: maintenance",
  "error": "Bad Request",
  "statusCode": 400
}
```

**Error Response - Service Not Found (404 Not Found):**

```json
{
  "message": "Service not found",
  "error": "Not Found",
  "statusCode": 404
}
```

**Error Response - Past Booking (400 Bad Request):**

```json
{
  "message": "Cannot book a session in the past",
  "error": "Bad Request",
  "statusCode": 400
}
```

**Error Response - Invalid Time Range (400 Bad Request):**

```json
{
  "message": "From datetime must be before to datetime",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

### 2. Get All User Sessions

**Endpoint:** `GET /api/sessions`
**Description:** Retrieve all sessions booked by the authenticated user, including service details
**Authentication:** Required (User)

**Request Headers:**

```
Authorization: Bearer <user-jwt-token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "sessionId": "uuid-1",
      "userId": "user-uuid",
      "providerId": "provider-uuid",
      "serviceId": "service-uuid",
      "fromDatetime": "2025-10-21T10:00:00Z",
      "toDatetime": "2025-10-21T12:00:00Z",
      "totalAmount": "30.00",
      "createdAt": "2025-10-21T09:00:00Z",
      "updatedAt": "2025-10-21T09:00:00Z",
      "service": {
        "serviceType": "parking",
        "address": "123 Main Street",
        "city": "San Francisco",
        "state": "CA",
        "country": "USA",
        "hourlyRate": "15"
      }
    },
    {
      "sessionId": "uuid-2",
      "userId": "user-uuid",
      "providerId": "provider-uuid-2",
      "serviceId": "service-uuid-2",
      "fromDatetime": "2025-10-22T14:00:00Z",
      "toDatetime": "2025-10-22T16:00:00Z",
      "totalAmount": "20.00",
      "createdAt": "2025-10-21T10:00:00Z",
      "updatedAt": "2025-10-21T10:00:00Z",
      "service": {
        "serviceType": "charger",
        "address": "456 Oak Avenue",
        "city": "Los Angeles",
        "state": "CA",
        "country": "USA",
        "hourlyRate": "10"
      }
    }
  ]
}
```

---

## Error Responses

### Common HTTP Status Codes

#### 400 Bad Request

Validation errors, business logic errors, or malformed requests.

```json
{
  "message": "Validation failed",
  "error": "Bad Request",
  "statusCode": 400
}
```

#### 401 Unauthorized

Missing or invalid JWT token.

```json
{
  "message": "Unauthorized",
  "error": "Unauthorized",
  "statusCode": 401
}
```

#### 403 Forbidden

User doesn't have permission (e.g., User trying to access Provider endpoints).

```json
{
  "message": "Forbidden resource",
  "error": "Forbidden",
  "statusCode": 403
}
```

#### 404 Not Found

Requested resource doesn't exist.

```json
{
  "message": "Resource not found",
  "error": "Not Found",
  "statusCode": 404
}
```

#### 500 Internal Server Error

Server error.

```json
{
  "message": "Internal server error",
  "error": "Internal Server Error",
  "statusCode": 500
}
```

---

## Additional Notes

### Date/Time Format

All datetime fields use **ISO 8601 format in UTC timezone**:

```
2025-10-21T10:00:00Z
```

### Service Types

- `parking` - Parking spot
- `charger` - EV charging station

### Service Status

- `available` - Ready for booking
- `occupied` - Currently in use
- `maintenance` - Temporarily unavailable

### JWT Token Expiration

JWT tokens expire after **24 hours**. After expiration, users must login again.

### Rate Limiting

Currently no rate limiting is enforced, but it may be added in future versions.

---

## Testing the API

### Using cURL

**Provider Signup:**

```bash
curl -X POST http://localhost:3000/api/provider/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@provider.com",
    "password": "Test123!",
    "name": "Test Provider",
    "phone": "+1234567890",
    "businessName": "Test Business"
  }'
```

**Book a Session:**

```bash
curl -X POST http://localhost:3000/api/sessions/book \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "serviceId": "YOUR_SERVICE_UUID",
    "fromDatetime": "2025-10-21T10:00:00Z",
    "toDatetime": "2025-10-21T12:00:00Z"
  }'
```

### Using Swagger UI

Visit `http://localhost:3000/api/docs` to:

- View all endpoints
- Test APIs interactively
- See request/response schemas
- Authenticate with JWT tokens

---

## Support

For issues or questions:

- GitHub: [Your Repository URL]
- Email: support@chargehive.com

---

**Last Updated:** October 21, 2025
