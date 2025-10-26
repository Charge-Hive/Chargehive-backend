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
6. [Payments APIs](#payments-apis)
7. [Error Responses](#error-responses)

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

## Payments APIs

### 1. Initiate Flow Payment

**Endpoint:** `POST /api/payments/initiateFlow`
**Description:** Start a Flow token payment for a booked session. Calculates the Flow token amount based on current market price and creates a pending payment record.
**Authentication:** Required (User)

**Request Headers:**

```
Authorization: Bearer <user-jwt-token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Flow payment initiated successfully",
  "data": {
    "paymentId": "payment-uuid",
    "amountUsd": 30.50,
    "flowTokenAmount": 46.92307692,
    "flowTokenPriceUsd": 0.65,
    "providerWalletAddress": "0x1234567890abcdef",
    "expiresAt": "2025-10-26T12:15:00Z"
  }
}
```

**Field Descriptions:**

- `paymentId`: UUID of the created payment record
- `amountUsd`: Total amount in USD (from session.total_amount)
- `flowTokenAmount`: Calculated Flow tokens to send (amountUsd / flowTokenPriceUsd)
- `flowTokenPriceUsd`: Current Flow token price locked for this payment
- `providerWalletAddress`: Provider's Flow wallet address to send tokens to
- `expiresAt`: Payment expiration time (15 minutes from creation)

**Error Responses:**

**Session Not Found (404):**

```json
{
  "message": "Session not found or does not belong to user",
  "error": "Not Found",
  "statusCode": 404
}
```

**Session Already Paid (400):**

```json
{
  "message": "This session has already been paid for",
  "error": "Bad Request",
  "statusCode": 400
}
```

**Provider No Wallet (400):**

```json
{
  "message": "Provider has not set up a Flow wallet. Please contact the provider or use card payment.",
  "error": "Bad Request",
  "statusCode": 400
}
```

**User No Wallet (400):**

```json
{
  "message": "You have not set up a Flow wallet. Please add your wallet address in settings.",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

### 2. Execute Flow Payment

**Endpoint:** `POST /api/payments/executeFlow`
**Description:** Submit the blockchain transaction hash after sending Flow tokens. This completes the payment and marks the session as paid.
**Authentication:** Required (User)

**Request Headers:**

```
Authorization: Bearer <user-jwt-token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "paymentId": "payment-uuid",
  "transactionHash": "0xabcdef1234567890...",
  "senderWalletAddress": "0xuser-wallet-address"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Payment completed successfully",
  "data": {
    "paymentId": "payment-uuid",
    "status": "completed"
  }
}
```

**Error Responses:**

**Payment Not Found (404):**

```json
{
  "message": "Payment not found or does not belong to user",
  "error": "Not Found",
  "statusCode": 404
}
```

**Payment Already Completed (400):**

```json
{
  "message": "This payment has already been completed",
  "error": "Bad Request",
  "statusCode": 400
}
```

**Payment Expired (400):**

```json
{
  "message": "Payment has expired. Please initiate a new payment.",
  "error": "Bad Request",
  "statusCode": 400
}
```

**Wallet Mismatch (400):**

```json
{
  "message": "Sender wallet address does not match payment record",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

### 3. Get Payment Status

**Endpoint:** `GET /api/payments/:paymentId/status`
**Description:** Check the current status of a payment
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
    "paymentId": "payment-uuid",
    "status": "completed",
    "transactionHash": "0xabcdef1234567890...",
    "verifiedAt": "2025-10-26T12:05:00Z"
  }
}
```

**Status Values:**

- `pending`: Payment initiated but not yet executed
- `completed`: Payment successful and verified
- `failed`: Payment failed or expired
- `refunded`: Payment was refunded

---

### 4. Get User Payment History

**Endpoint:** `GET /api/payments/user`
**Description:** Retrieve all payments made by the authenticated user
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
    "count": 2,
    "payments": [
      {
        "paymentId": "payment-uuid-1",
        "sessionId": "session-uuid-1",
        "providerId": "provider-uuid",
        "paymentMethod": "flow_token",
        "amountUsd": 30.50,
        "flowTokenAmount": 46.92307692,
        "flowTokenPriceUsd": 0.65,
        "status": "completed",
        "transactionHash": "0xabcdef1234567890...",
        "createdAt": "2025-10-26T12:00:00Z",
        "updatedAt": "2025-10-26T12:05:00Z",
        "serviceType": "parking",
        "serviceAddress": "123 Main Street",
        "fromDatetime": "2025-10-26T14:00:00Z",
        "toDatetime": "2025-10-26T16:00:00Z"
      },
      {
        "paymentId": "payment-uuid-2",
        "sessionId": "session-uuid-2",
        "providerId": "provider-uuid-2",
        "paymentMethod": "flow_token",
        "amountUsd": 20.00,
        "flowTokenAmount": 30.76923077,
        "flowTokenPriceUsd": 0.65,
        "status": "completed",
        "transactionHash": "0x9876543210fedcba...",
        "createdAt": "2025-10-25T10:00:00Z",
        "updatedAt": "2025-10-25T10:03:00Z",
        "serviceType": "charger",
        "serviceAddress": "456 Oak Avenue",
        "fromDatetime": "2025-10-25T12:00:00Z",
        "toDatetime": "2025-10-25T14:00:00Z"
      }
    ]
  }
}
```

---

### 5. Get Provider Earnings

**Endpoint:** `GET /api/payments/provider`
**Description:** Retrieve all earnings and payment details for the authenticated provider
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
    "totalEarningsUsd": 150.50,
    "totalFlowTokens": 231.53846154,
    "completedPayments": 5,
    "pendingPayments": 1,
    "payments": [
      {
        "paymentId": "payment-uuid-1",
        "sessionId": "session-uuid-1",
        "userId": "user-uuid-1",
        "paymentMethod": "flow_token",
        "amountUsd": 30.50,
        "flowTokenAmount": 46.92307692,
        "status": "completed",
        "transactionHash": "0xabcdef1234567890...",
        "createdAt": "2025-10-26T12:00:00Z",
        "serviceType": "parking",
        "fromDatetime": "2025-10-26T14:00:00Z",
        "toDatetime": "2025-10-26T16:00:00Z"
      },
      {
        "paymentId": "payment-uuid-2",
        "sessionId": "session-uuid-2",
        "userId": "user-uuid-2",
        "paymentMethod": "flow_token",
        "amountUsd": 120.00,
        "flowTokenAmount": 184.61538462,
        "status": "completed",
        "transactionHash": "0x1111222233334444...",
        "createdAt": "2025-10-25T08:00:00Z",
        "serviceType": "charger",
        "fromDatetime": "2025-10-25T10:00:00Z",
        "toDatetime": "2025-10-25T16:00:00Z"
      }
    ]
  }
}
```

**Field Descriptions:**

- `totalEarningsUsd`: Sum of all completed payments in USD
- `totalFlowTokens`: Sum of all Flow tokens received from completed payments
- `completedPayments`: Count of successfully completed payments
- `pendingPayments`: Count of payments awaiting completion

---

### Payment Flow Example

**Step 1: User books a session**

```bash
POST /api/sessions/book
{
  "serviceId": "service-uuid",
  "fromDatetime": "2025-10-26T14:00:00Z",
  "toDatetime": "2025-10-26T16:00:00Z"
}
# Response: sessionId, totalAmount: $30.50
```

**Step 2: User initiates Flow payment**

```bash
POST /api/payments/initiateFlow
{
  "sessionId": "session-uuid"
}
# Response:
# - paymentId
# - flowTokenAmount: 46.92 FLOW
# - providerWalletAddress: 0x...
# - Price locked: $0.65/FLOW
# - Expires in 15 minutes
```

**Step 3: User sends Flow tokens via wallet**

User uses their Flow wallet (Blocto, Lilico, etc.) to send 46.92 FLOW tokens to the provider's wallet address.

**Step 4: User submits transaction hash**

```bash
POST /api/payments/executeFlow
{
  "paymentId": "payment-uuid",
  "transactionHash": "0xabcdef...",
  "senderWalletAddress": "0xuser-wallet"
}
# Response: status "completed"
# Session is now marked as "paid"
```

**Step 5: Check payment status (optional)**

```bash
GET /api/payments/payment-uuid/status
# Response: status, transactionHash, verifiedAt
```

---

### Important Notes

**Flow Token Price:**

- Fetched from CoinGecko API in real-time
- Cached for 1 minute to reduce API calls
- Price is locked when payment is initiated
- User has 15 minutes to complete payment at locked price

**Payment Expiration:**

- Payments expire 15 minutes after initiation
- Expired payments are automatically marked as "failed"
- User must initiate a new payment to try again

**Wallet Requirements:**

- Both user and provider must have Flow wallet addresses set up
- User wallet address is stored in `users.wallet_address`
- Provider wallet address is stored in `providers.wallet_address`

**Blockchain Verification:**

- Current implementation marks payment as "completed" immediately
- Production version should verify transaction on Flow blockchain
- Verification should check:
  - Transaction exists and is sealed
  - Correct amount sent
  - Correct sender and receiver addresses

**Testing on Flow Testnet:**

Use Flow Testnet for development:
- Get testnet FLOW from faucet
- Configure Flow testnet network in wallet
- Provider must share testnet wallet address

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
