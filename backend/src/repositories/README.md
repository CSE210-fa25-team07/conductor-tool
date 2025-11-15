# Repositories

Database queries. One file per table (roughly).

## Files

- `userRepository.js` - Auth + Directory teams (shared)
- `teamRepository.js` - Directory team (shared with others)
- `attendanceRepository.js` - Attendance team
- `standupRepository.js` - Standup team

## Responsibilities

- Execute SQL queries
- Return raw data
- **NO business logic** (just CRUD)

## Pattern

```javascript
import { db } from '../config/database.js';

export const yourRepository = {
  async insert(data) {
    const query = 'INSERT INTO table (...) VALUES ($1, $2) RETURNING *;';
    const result = await db.query(query, [data.field1, data.field2]);
    return result.rows[0];
  },

  async findById(id) {
    const query = 'SELECT * FROM table WHERE id = $1;';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
};
```

**Always use parameterized queries** ($1, $2) to prevent SQL injection.
