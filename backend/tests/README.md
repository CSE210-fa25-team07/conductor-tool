# Backend Tests

Unit and integration tests.

## Structure

```
tests/
├── unit/              # Mock dependencies, test individual functions
│   ├── services/
│   └── repositories/
└── integration/       # Full API tests (request → response)
    ├── auth.test.js
    ├── attendance.test.js
    └── standup.test.js
```

## Pattern

**Unit test:**
```javascript
import { yourService } from '../../../src/services/yourService.js';
jest.mock('../../../src/repositories/yourRepository.js');

test('does something', async () => {
  // Mock and test
});
```

**Integration test:**
```javascript
import request from 'supertest';
import app from '../../src/server.js';

test('POST /api/stuff', async () => {
  const response = await request(app)
    .post('/api/stuff')
    .send({ data: 'test' });
  
  expect(response.status).toBe(201);
});
```

Run: `npm test`
