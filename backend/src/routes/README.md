# Routes

HTTP route definitions. One file per team.

## Files

- `authRoutes.js` - Auth team
- `directoryRoutes.js` - Directory team
- `attendanceRoutes.js` - Attendance team
- `standupRoutes.js` - Standup team

## Pattern

```javascript
import express from 'express';
import { yourController } from '../controllers/yourController.js';
import { authMiddleware, rbacMiddleware } from '../middleware/index.js';

const router = express.Router();

router.post('/',
  authMiddleware,                    // Check login
  rbacMiddleware(['allowed_role']),  // Check role
  yourController.action              // Handle request
);

export default router;
```

Wire up in `server.js`: `app.use('/api/path', yourRoutes);`
