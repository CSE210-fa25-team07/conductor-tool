# Database

PostgreSQL setup and migrations.

## Folders

- `migrations/` - Numbered SQL files for schema (001, 002, 003...)
- `seeds/` - Sample dev data

## Team Ownership

- **Auth:** User/role tables
- **Directory:** Team/course tables
- **Attendance:** Meeting/attendance tables
- **Standup:** Standup tables

## Pattern

One migration file per table. Number them in order (001, 002, etc.).

```sql
CREATE TABLE your_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field VARCHAR(255) NOT NULL
);
```

Run: `psql -U conductor -d conductor_db < migrations/001_file.sql`
