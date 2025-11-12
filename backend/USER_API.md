# User Management API

## Overview

This implements a simple JSON-based user storage system following MVC architecture:

- **Model**: `database/users.json` - JSON file storing user data
- **Repository**: `backend/src/repositories/userRepository.js` - Data access layer
- **Service**: `backend/src/services/userService.js` - Business logic layer
- **Controller**: `backend/src/routes/authRoutes.js` - Route handlers

## User Data Structure

Each user has the following fields:
```json
{
  "id": "1699876543210",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "createdAt": "2025-11-11T12:34:56.789Z"
}
```

## API Endpoints

### 1. Create User (Sign Up)

**POST** `/auth/signup`

Creates a new user in the system.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": "1699876543210",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "createdAt": "2025-11-11T12:34:56.789Z"
  }
}
```

**Error Responses:**
- `400` - Validation error (missing or invalid fields)
- `409` - User with email already exists

**Example:**
```bash
curl -X POST http://localhost:8081/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  }'
```

### 2. Get User by Email

**GET** `/auth/users?email={email}`

Retrieves a user by their email address.

**Query Parameters:**
- `email` (required) - The email address to search for

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "1699876543210",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "createdAt": "2025-11-11T12:34:56.789Z"
  }
}
```

**Error Responses:**
- `400` - Missing email parameter
- `404` - User not found

**Example:**
```bash
curl "http://localhost:8081/auth/users?email=john.doe@example.com"
```

### 3. Get All Users

**GET** `/auth/users/all`

Retrieves all users in the system.

**Success Response (200):**
```json
{
  "success": true,
  "count": 2,
  "users": [
    {
      "id": "1699876543210",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "createdAt": "2025-11-11T12:34:56.789Z"
    },
    {
      "id": "1699876543211",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@example.com",
      "createdAt": "2025-11-11T12:35:00.123Z"
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:8081/auth/users/all
```

### 4. Google OAuth Integration

When users sign in via Google OAuth (`/auth/google`), the system automatically:
1. Extracts first name, last name, and email from their Google profile
2. Checks if the user already exists in the database
3. If not, creates a new user record
4. Stores the user in the session

### 5. Get Current Session User

**GET** `/auth/session`

Returns the currently authenticated user from the session.

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "email": "john.doe@example.com",
    "name": "John Doe",
    "picture": "https://...",
    "given_name": "John",
    "family_name": "Doe"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "Not authenticated"
}
```

**Example:**
```bash
curl http://localhost:8081/auth/session --cookie-jar cookies.txt
```

## Frontend Integration

The frontend (`frontend/js/pages/auth/auth.js`) now:
1. **Login Flow**: Redirects to `/auth/google` for OAuth
2. **After OAuth**: Backend automatically stores user in DB and session
3. **Verification Page**: Fetches current user from `/auth/session` endpoint
4. **Session Check**: Frontend can verify if user is logged in and get their info

### Complete User Flow

1. User clicks "Login with Google" → Redirects to `/auth/google`
2. Google OAuth completes → Backend callback at `/auth/google/callback`
3. Backend extracts user info and stores in `database/users.json` (if new)
4. Backend stores user in session
5. User redirected to verification page
6. Frontend calls `/auth/session` to get current user info
7. After verification, user proceeds to dashboard

## Testing

### Start the Server

```bash
cd backend/src
node server.js
```

The server will run on `http://localhost:8081`.

### Test Sequence

1. **Create a new user:**
```bash
curl -X POST http://localhost:8081/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Alice",
    "lastName": "Johnson",
    "email": "alice@example.com"
  }'
```

2. **Get user by email:**
```bash
curl "http://localhost:8081/auth/users?email=alice@example.com"
```

3. **Get all users:**
```bash
curl http://localhost:8081/auth/users/all
```

4. **Try to create duplicate (should fail with 409):**
```bash
curl -X POST http://localhost:8081/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Alice",
    "lastName": "Johnson",
    "email": "alice@example.com"
  }'
```

5. **Try invalid email (should fail with 400):**
```bash
curl -X POST http://localhost:8081/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Bob",
    "lastName": "Smith",
    "email": "not-an-email"
  }'
```

## Data Storage

User data is stored in `database/users.json`. You can view or manually edit this file:

```bash
cat database/users.json
```

To reset the database, simply empty the file:
```bash
echo "[]" > database/users.json
```

## Validation Rules

- **firstName**: Required, non-empty string
- **lastName**: Required, non-empty string
- **email**: Required, valid email format, unique across all users
- All fields are trimmed of whitespace
- Emails are normalized to lowercase

## Architecture

### Repository Layer (`userRepository.js`)
- Direct file I/O operations
- CRUD operations on JSON data
- No business logic

### Service Layer (`userService.js`)
- Input validation
- Data normalization
- Business rules enforcement
- Delegates to repository

### Route Layer (`authRoutes.js`)
- HTTP request/response handling
- Status code management
- Delegates to service

This separation follows MVC principles and makes the code testable and maintainable.
