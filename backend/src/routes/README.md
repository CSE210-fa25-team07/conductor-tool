# Routes

HTTP route definitions. One file per team.

## Files

- `authRoutes.js` - Auth team
- `courseRoutes.js` - Dynamic endpoint for each course (wires to below endpoints)
- `directoryRoutes.js` - Directory team
- `attendanceRoutes.js` - Attendance team
- `standupRoutes.js` - Standup team

## Pattern
Refer to `authRoutes.js` for examples of how we can use HTTP endpoints.
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