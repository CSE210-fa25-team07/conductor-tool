# Backend Tests

Unit and integration tests.

## Structure

```
tests/
├── unit/              # Mock dependencies, test individual functions
│   ├── services/
│   └── repositories/
└── integration/       # Full API tests (request → response)
    ├── attendanceApi.test.js
    └── standupApi.test.js
```

## Pattern

**Unit test:**
```javascript
import { yourService } from '../../../src/services/yourService.js';

describe('yourService', () => {
  it('does something', async () => {
    // Example: mock a function
    yourRepo.someFunction.mockResolvedValue('mocked result');

    const result = await yourService();
    expect(result).toBe('expected value');
  });
});
```

**Integration test:**
```javascript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from "express";
import session from "express-session";
import { getPrisma } from "../../src/utils/db.js";

const app = express();
const prisma = getPrisma();

describe('POST /api/stuff', () => {
  beforeAll(() => {
    // Set up test
  });

  it('should create a new resource', async () => {
    const response = await request(app)
      .post('/api/stuff')
      .send({ data: 'test' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
```

Run `npm run test` to check if all test cases pass
