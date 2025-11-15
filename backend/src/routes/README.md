# Routes

HTTP route definitions. One file per team.

## Files

- `authRoutes.js` - Auth team
- `directoryRoutes.js` - Directory team
- `attendanceRoutes.js` - Attendance team
- `standupRoutes.js` - Standup team

## Pattern

```javascript
import express from "express";

const router = express.Router();

router.get("/google", (req, res) => {
  const redirectUrl =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
      "client_id": CLIENT_ID,
      "redirect_uri": REDIRECT_URI,
      "response_type": "code",
      "scope": "openid email profile"
    });
  res.redirect(redirectUrl);
});

export default router;
```

Wire up in `server.js`: `app.use("/api/path", yourRoutes);`
