# Backend

Node.js + Express API. Port 8081.

## Folders

- `src/routes/` - HTTP routes (one file per team)
- `src/controllers/` - Request handlers (one file per team)
- `src/services/` - Business logic (one file per team)
- `src/repositories/` - Database queries (one file per table)
- `src/sockets/` - Socket.io handlers
- `tests/` - Unit and integration tests

## 3-Layer Pattern

Route → Controller → Service → Repository

**Check each folder's README for details.**
