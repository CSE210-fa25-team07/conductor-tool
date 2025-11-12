# API Layer

Functions that call the backend. One file per feature.

## Files

- `apiClient.js` - Base wrapper (Auth team implements first, everyone uses)
- `authApi.js` - Auth team
- `directoryApi.js` - Directory team
- `attendanceApi.js` - Attendance team
- `standupApi.js` - Standup team

## Pattern

Export async functions that return data:

```javascript
import { apiClient } from './apiClient.js';

export async function getStuff() {
  return apiClient.get('/api/stuff');
}

export async function createStuff(data) {
  return apiClient.post('/api/stuff', data);
}
```

**Rule:** All API calls go through `apiClient` (handles auth tokens, errors).
