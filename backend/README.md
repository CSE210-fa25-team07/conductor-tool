# Backend

Node.js + Express API. Port 8081.

## Folders

- `src/routes/` - HTTP routes (one file per team)
- `src/services/` - Business logic (one file per team)
- `src/repositories/` - Database queries (one file per table)
- `tests/` - Unit and integration tests

## 3-Layer Pattern

Route → Service → Repository

## Express Session
The `express` session keeps track of the logged-in user with information that the database can use to query.

### Example
 ```js
 app.get("/endpoint", (req, res) => {
  const user = req.session.user;
  /**
  These fields can be available and passed into your query:
  user.name
  user.id
  user.email
  */
});
```

**Check each folder's README for details.**
