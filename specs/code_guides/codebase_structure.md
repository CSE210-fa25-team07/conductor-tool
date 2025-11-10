# Conductor Tool - Codebase Structure

Quick reference for where to put your code.

---

## Project Root

```
conductor-tool/
├── frontend/           # HTML/CSS/JS
├── backend/            # Node.js/Express (Port 8081)
└── database/           # PostgreSQL migrations & seeds
```

---

## Frontend (`/frontend`)

```
frontend/
├── public/
│   └── index.html
│
└── src/
    ├── js/
    │   ├── main.js                    # Entry point
    │   │
    │   ├── api/                       # API calls
    │   │   ├── apiClient.js           # Base fetch wrapper
    │   │   ├── authApi.js
    │   │   ├── directoryApi.js
    │   │   ├── attendanceApi.js
    │   │   └── standupApi.js
    │   │
    │   ├── pages/                     # Page logic
    │   │   ├── auth/
    │   │   ├── directory/
    │   │   ├── attendance/
    │   │   └── standup/
    │   │
    │   ├── components/                # Reusable UI
    │   │   ├── navbar.js
    │   │   ├── userCard.js
    │   │   └── standupForm.js
    │   │
    │   ├── utils/                     # Helpers
    │   │   ├── auth.js
    │   │   ├── formatDate.js
    │   │   └── socket.js
    │   │
    │   └── __tests__/                 # Unit tests
    │       ├── api/
    │       ├── utils/
    │       └── components/
    │
    └── css/
        ├── main.css
        ├── components/
        └── pages/
```

**Example:** `/frontend/src/js/api/standupApi.js`
```javascript
import { apiClient } from './apiClient.js';

export async function submitStandup(data) {
  return apiClient.post('/api/standups', data);
}

export async function getTeamStandups(teamId) {
  return apiClient.get(`/api/standups/team/${teamId}`);
}
```

---

## Backend (`/backend`)

```
backend/
├── src/
│   ├── server.js                      # Entry point
│   │
│   ├── routes/                        # HTTP routing
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── attendanceRoutes.js
│   │   └── standupRoutes.js
│   │
│   ├── controllers/                   # Request handlers
│   │   ├── authController.js
│   │   ├── attendanceController.js
│   │   └── standupController.js
│   │
│   ├── services/                      # Business logic
│   │   ├── authService.js
│   │   ├── attendanceService.js
│   │   ├── standupService.js
│   │   ├── githubService.js
│   │   ├── notificationService.js
│   │   └── qrCodeService.js
│   │
│   ├── repositories/                  # Database queries
│   │   ├── userRepository.js
│   │   ├── attendanceRepository.js
│   │   └── standupRepository.js
│   │
│   ├── sockets/                       # Socket.io
│   │   ├── index.js
│   │   └── standupSocket.js
│   │
│   ├── utils/
│   │   ├── logger.js
│   │   └── constants.js
│   │
│   └── validators/                    # Joi schemas
│       ├── authValidators.js
│       └── standupValidators.js
│
└── tests/                             # Unit & integration tests
    ├── unit/
    │   ├── services/
    │   └── repositories/
    └── integration/
        ├── auth.test.js
        ├── attendance.test.js
        └── standup.test.js
```

### 3-Layer Pattern (IMPORTANT)

```
Route → Controller → Service → Repository
  │         │           │          │
  │         │           │          └─ DB queries only
  │         │           └─ Business logic
  │         └─ Request/response handling
  └─ URL mapping + validation
```

**Example Route:** `/backend/src/routes/standupRoutes.js`
```javascript
import express from 'express';
import { standupController } from '../controllers/standupController.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('<a href="/auth/google">Login with Google</a>');
});

export default router;
```

**Example Service:** `/backend/src/services/standupService.js`
```javascript
import { standupRepository } from '../repositories/standupRepository.js';
import { io } from '../sockets/index.js';

export const standupService = {
  async create(data, userId) {
    const standup = await standupRepository.insert({ ...data, user_uuid: userId });
    io.to(`team_${data.team_uuid}`).emit('standup:submitted', standup);
    return standup;
  }
};
```

**Example Repository:** `/backend/src/repositories/standupRepository.js`
```javascript
import { db } from '../config/database.js';

export const standupRepository = {
  async insert(data) {
    const query = 'INSERT INTO standups (...) VALUES ($1, $2, ...) RETURNING *;';
    const result = await db.query(query, [data.user_uuid, data.yesterday, ...]);
    return result.rows[0];
  }
};
```

---

## Testing

### Frontend Tests (`/frontend/src/js/__tests__/`)
Test API functions, utilities, components. Use **Jest** or **Vitest**.

**Example:** `__tests__/api/standupApi.test.js`
```javascript
import { submitStandup } from '../../api/standupApi.js';

global.fetch = jest.fn();

test('submitStandup sends POST request', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
  await submitStandup({ yesterday: 'Test' });
  expect(fetch).toHaveBeenCalledWith('/api/standups', expect.any(Object));
});
```

### Backend Tests (`/backend/tests/`)

**Unit tests** (mock dependencies):
```javascript
import { standupService } from '../../../src/services/standupService.js';
import { teamRepository } from '../../../src/repositories/teamRepository.js';

jest.mock('../../../src/repositories/teamRepository.js');

test('create throws error if user not in team', async () => {
  jest.spyOn(teamRepository, 'isUserInTeam').mockResolvedValue(false);
  await expect(standupService.create({}, 'user-1')).rejects.toThrow();
});
```

**Integration tests** (full API):
```javascript
import request from 'supertest';
import app from '../../src/server.js';

test('POST /api/standups creates standup', async () => {
  const response = await request(app)
    .post('/api/standups')
    .set('Authorization', 'Bearer token')
    .send({ yesterday: 'Test', today: 'Test' });
  
  expect(response.status).toBe(201);
  expect(response.body.data).toHaveProperty('standup_uuid');
});
```

---

## Team Assignments

| Team | Frontend | Backend |
|------|----------|---------|
| **Auth** | `pages/auth/*`, `authApi.js` | `authRoutes.js`, `authService.js` |
| **Directory** | `pages/directory/*`, `directoryApi.js` | `directoryRoutes.js`, `userRepository.js` |
| **Attendance** | `pages/attendance/*`, `attendanceApi.js` | `attendanceRoutes.js`, `qrCodeService.js` |
| **Standup** | `pages/standup/*`, `standupApi.js` | `standupRoutes.js`, `githubService.js` |

---

## Quick Rules

1. **Don't mix layers:** No DB queries in routes, no business logic in repositories
2. **Use ES6 modules:** `import/export`, not `require/module.exports`
3. **Async/await:** Not promise chains (`.then()`)
4. **Error handling:** Controllers catch, services throw
5. **File naming:** Match feature name (e.g., `standupService.js`, `standupRoutes.js`)
6. **Write tests:** Unit tests for services/repos, integration tests for APIs

---

## Where Does My Code Go?

| What are you writing? | Where? |
|----------------------|--------|
| UI component | `/frontend/src/js/components/` |
| Full page | `/frontend/src/js/pages/` |
| API call | `/frontend/src/js/api/` |
| Frontend test | `/frontend/src/js/__tests__/` |
| HTTP route | `/backend/src/routes/` |
| Business logic | `/backend/src/services/` |
| Database query | `/backend/src/repositories/` |
| Backend unit test | `/backend/tests/unit/` |
| Backend integration test | `/backend/tests/integration/` |
| Database migration | `/database/migrations/` |

---

**Need help?** Check folder READMEs or see [subteam_expectations.md](subteam_expectations.md) for detailed workflows.
