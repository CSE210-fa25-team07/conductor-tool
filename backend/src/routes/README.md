# Routes

HTTP route definitions. Two types: API endpoints and Web serving endpoints

## Files

- `authRoutes.js` - Auth team
- `courseRoutes.js` - Dynamic endpoint for each course (wires to below endpoints)
- `directoryRoutes.js` - Directory team
- `attendanceRoutes.js` - Attendance team
- `standupRoutes.js` - Standup team

## Web Pattern
Refer to `web/authRoutes.js` for examples of how we can use HTTP endpoints to serve web pages.
```javascript
import express from "express";

const router = express.Router();

/**
 * Serves verification page for new users
 * @name GET /auth/verification
 * @status IN USE
 */
router.get("/verification", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../frontend/html/auth/verification.html"));
});

export default router;
```
`directory`, `attendance`, and `standup` routes are wired from `courseRoutes` which uses dynamic endpoint `/courses/:courseId`. Below is an example of how we can use the dynamic endpoint to query content from the database
### Using Dynamic endpoint
```js
app.get("/directory", (req, res) => {
  const courseId = req.params.courseId; // "123" if URL is /courses/123/directory

  // Render class directory for course with courseId "123"
});
```

## API Pattern
We use prefix `/v1/api/` for our current API endpoints. Refer to `/api/authApi.js` for examples of how we can use API endpoints.
```js
/**
 * Get current session user
 *
 * @name GET /v1/api/auth/session
 * @returns {Object} 200 - Current user from session
 * @returns {Object} 401 - Not authenticated
 * @status IN USE - Frontend fetches current user session data
 */
router.get("/session", async (req, res) => {
  try {
    return await authService.getSession(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```
