# Controllers

Request/response handlers. One file per team.

## Files

- `authController.js` - Auth team
- `directoryController.js` - Directory team
- `attendanceController.js` - Attendance team
- `standupController.js` - Standup team

## Responsibilities

- Extract data from `req`
- Call service layer
- Return HTTP response
- **NO business logic** (goes in services)

## Pattern

```javascript
export const yourController = {
  async action(req, res, next) {
    try {
      const result = await yourService.doSomething(req.body, req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
};
```
