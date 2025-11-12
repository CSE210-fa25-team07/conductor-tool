# Complete User Authentication & Storage Flow

## Overview

This document describes the complete user flow from login to storage in the JSON database.

## Architecture Components

### Backend (MVC Pattern)
- **Model**: `database/users.json` - JSON file storage
- **Repository**: `backend/src/repositories/userRepository.js` - Data access
- **Service**: `backend/src/services/userService.js` - Business logic
- **Controller**: `backend/src/routes/authRoutes.js` - Route handlers

### Frontend
- **View**: `frontend/html/auth/login.html` & `verification.html`
- **Controller**: `frontend/js/pages/auth/auth.js` - Client-side logic

## Complete User Flow

### 1. Login Page (Initial State)
```
User visits: http://localhost:8081/
├─ Served: frontend/html/auth/login.html
└─ Loads: frontend/js/pages/auth/auth.js
```

### 2. User Clicks "Login with Google"
```javascript
// frontend/js/pages/auth/auth.js
handleGoogleLogin() {
    window.location.href = "http://localhost:8081/auth/google";
}
```

### 3. Backend Redirects to Google OAuth
```javascript
// backend/src/routes/authRoutes.js
router.get("/google", (req, res) => {
    // Redirects to Google's OAuth consent screen
    res.redirect("https://accounts.google.com/o/oauth2/v2/auth?...");
});
```

### 4. Google OAuth Callback
```javascript
router.get("/google/callback", async (req, res) => {
    // 1. Exchange code for access token
    // 2. Fetch user profile from Google
    const profile = await fetch("https://www.googleapis.com/oauth2/v2/userinfo");
    
    // 3. Check if user exists in database
    const existingUser = await userService.getUserByEmail(profile.email);
    
    // 4. If new user, add to database
    if (!existingUser) {
        await userService.addUser({
            firstName: profile.given_name,
            lastName: profile.family_name,
            email: profile.email
        });
    }
    
    // 5. Store in session
    req.session.user = profile;
    
    // 6. Redirect to verification page
    res.redirect("/auth/verification");
});
```

### 5. User Repository Stores Data
```javascript
// backend/src/repositories/userRepository.js
async function addUser(user) {
    const users = await loadUsers(); // Read from database/users.json
    
    const newUser = {
        id: Date.now().toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    await saveUsers(users); // Write to database/users.json
    
    return newUser;
}
```

### 6. Database State After User Creation
```json
// database/users.json
[
  {
    "id": "1699876543210",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "createdAt": "2025-11-11T12:34:56.789Z"
  }
]
```

### 7. Verification Page Loads
```javascript
// frontend/js/pages/auth/auth.js
document.addEventListener("DOMContentLoaded", () => {
    if (verificationForm) {
        checkUserSession(); // Fetch current user info
    }
});

async function checkUserSession() {
    const response = await fetch("http://localhost:8081/auth/session", {
        credentials: "include" // Send session cookie
    });
    
    if (response.ok) {
        const data = await response.json();
        displayUserInfo(data.user); // Show user info in UI
    }
}
```

### 8. Backend Returns Session Data
```javascript
// backend/src/routes/authRoutes.js
router.get("/session", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "Not authenticated" });
    }
    
    res.json({
        success: true,
        user: req.session.user // From Google OAuth
    });
});
```

## Data Flow Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ 1. Click "Login with Google"
       ▼
┌─────────────────────┐
│ /auth/google        │
│ (authRoutes.js)     │
└──────┬──────────────┘
       │ 2. Redirect to Google
       ▼
┌─────────────────────┐
│  Google OAuth 2.0   │
└──────┬──────────────┘
       │ 3. Auth code
       ▼
┌─────────────────────────────┐
│ /auth/google/callback       │
│ (authRoutes.js)             │
└──────┬──────────────────────┘
       │ 4. Fetch profile
       ▼
┌─────────────────────────────┐
│ userService.getUserByEmail  │
│ (userService.js)            │
└──────┬──────────────────────┘
       │ 5. Check existence
       ▼
┌─────────────────────────────┐
│ userRepository.getUserByEmail│
│ (userRepository.js)         │
└──────┬──────────────────────┘
       │ 6. Read database/users.json
       ▼
   ┌─────────┐
   │Not found│
   └────┬────┘
        │ 7. Add new user
        ▼
┌─────────────────────────────┐
│ userService.addUser         │
│ (userService.js)            │
└──────┬──────────────────────┘
       │ 8. Validate & normalize
       ▼
┌─────────────────────────────┐
│ userRepository.addUser      │
│ (userRepository.js)         │
└──────┬──────────────────────┘
       │ 9. Write database/users.json
       ▼
┌─────────────────────────────┐
│ Express Session             │
│ req.session.user = profile  │
└──────┬──────────────────────┘
       │ 10. Redirect to verification
       ▼
┌─────────────────────────────┐
│ /auth/verification          │
│ (verification.html)         │
└──────┬──────────────────────┘
       │ 11. Load auth.js
       ▼
┌─────────────────────────────┐
│ checkUserSession()          │
│ (auth.js)                   │
└──────┬──────────────────────┘
       │ 12. GET /auth/session
       ▼
┌─────────────────────────────┐
│ Return req.session.user     │
│ (authRoutes.js)             │
└──────┬──────────────────────┘
       │ 13. Display user info
       ▼
┌─────────────────────────────┐
│   Verification Page         │
│   (User sees their info)    │
└─────────────────────────────┘
```

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/auth/google` | Initiate Google OAuth |
| GET | `/auth/google/callback` | Handle OAuth callback, store user |
| POST | `/auth/signup` | Manually create user |
| GET | `/auth/users?email=x` | Get user by email |
| GET | `/auth/users/all` | Get all users |
| GET | `/auth/session` | Get current session user |

## Testing the Complete Flow

1. **Start the server:**
```bash
cd backend/src
node server.js
```

2. **Open browser:**
```
http://localhost:8081/
```

3. **Click "Login with Google"**
   - Redirects to Google OAuth
   - User authenticates
   - Returns to verification page
   - User stored in `database/users.json`

4. **Check stored users:**
```bash
cat database/users.json
```

5. **Or via API:**
```bash
curl http://localhost:8081/auth/users/all
```

## Session Management

- **Session Cookie**: Express-session with server-side storage
- **Session Data**: Contains Google OAuth profile
- **Cookie Settings**: 
  - `secure: false` (development)
  - `httpOnly: true` (default)
  - `sameSite: 'lax'` (default)

## Security Notes

- Passwords are NOT stored (using Google OAuth)
- Session secret should be in `.env` file
- Email is normalized to lowercase for consistency
- Duplicate emails are prevented at repository level
- Input validation at service layer

## Future Enhancements

- [ ] Add email verification codes to database
- [ ] Implement actual verification code validation
- [ ] Add user update/delete endpoints
- [ ] Add logout endpoint that clears session
- [ ] Add role-based access (professor/student)
- [ ] Migrate from JSON to proper database (PostgreSQL/MongoDB)
