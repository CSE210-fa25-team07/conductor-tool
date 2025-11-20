# Services

Business logic. One file per team, plus shared services.

## Feature Services (One Per Team)

- `authService.js` - Auth team
- `directoryService.js` - Directory team
- `attendanceService.js` - Attendance team
- `standupService.js` - Standup team

## Shared Services (Used by Multiple Teams)

- `userService.js` - Get user information
- `qrCodeService.js` - Attendance team (QR code generation)
- `notificationService.js` - Standup team (Slack/Email/SMS)

## Responsibilities

- Business logic (validation, workflows)
- Call repositories for data
- Call external APIs
- **NO SQL queries** (that's repositories)
