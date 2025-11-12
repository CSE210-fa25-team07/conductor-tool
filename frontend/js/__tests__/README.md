# Frontend Tests

Unit tests for API functions, utilities, components.

## Structure

Mirror source structure:
- `api/standupApi.test.js` tests `api/standupApi.js`
- `utils/formatDate.test.js` tests `utils/formatDate.js`

## Pattern

```javascript
import { yourFunction } from '../path/to/file.js';

test('does something', () => {
  expect(yourFunction()).toBe(expected);
});
```

Use Jest or Vitest. Mock `fetch` for API tests.
