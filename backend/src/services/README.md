# Services

Business logic. One file per team, plus shared services.

## Feature Services (One Per Team)

- `authService.js` - Auth team
- `directoryService.js` - Directory team
- `attendanceService.js` - Attendance team
- `standupService.js` - Standup team

## Shared Services (Used by Multiple Teams)

- `githubService.js` - Standup team (GitHub API integration)
- `qrCodeService.js` - Attendance team (QR code generation)
- `notificationService.js` - Standup team (Slack/Email/SMS)

## Responsibilities

- Business logic (validation, workflows)
- Call repositories for data
- Call external APIs
- **NO SQL queries** (that's repositories)

## Pattern

```javascript
import { yourRepository } from '../repositories/yourRepository.js';

export const yourService = {
  async doSomething(data) {
    // Validate
    if (!data.field) throw new Error('Missing field');
    
    // Save to DB
    return yourRepository.insert(data);
  }
};
```
