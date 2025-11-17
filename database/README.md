# Database

PostgreSQL setup and migrations for the Conductor Tool.

## Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed

### Setup

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` if needed** (optional - defaults work fine):
   - Change `POSTGRES_PORT` if you have another PostgreSQL instance running
   - Update passwords for production use

3. **Start the database:**
   ```bash
   docker compose up -d
   ```

4. **Verify it's running:**
   ```bash
   docker compose ps
   ```

### Access

- **PostgreSQL:** `localhost:5432` (or your custom port)
  - Database: `conductor`
  - User: `conductor_user`
  - Password: `conductor_pass`

- **PgAdmin (Web UI):** http://localhost:5050
  - Email: `admin@conductor.local`
  - Password: `admin`

### Connection String
```
postgresql://conductor_user:conductor_pass@localhost:5432/conductor
```

### Useful Commands

```bash
# Start the database
docker compose up -d

# Stop the database
docker compose down

# View logs
docker compose logs -f postgres

# Connect to database via CLI
docker exec -it conductor-postgres psql -U conductor_user -d conductor

# Stop and remove all data (fresh start)
docker compose down -v
```

## Database Schema

The schema is automatically initialized from [init.sql](./init.sql) when the container first starts. It includes:
- All tables from TABLES.md
- Foreign key relationships
- Indexes for performance
- Default roles (student, ta, professor, admin)
- Automatic timestamp triggers

## Folders

- `migrations/` - Numbered SQL files for schema changes (001, 002, 003...)
- `seeds/` - Sample dev data
- `init.sql` - Initial schema (auto-runs on first start)

## Team Ownership

- **Auth:** User/role tables
- **Directory:** Team/course tables
- **Attendance:** Meeting/attendance tables
- **Standup:** Standup tables

## Manual Migration Pattern

One migration file per table. Number them in order (001, 002, etc.).

```sql
CREATE TABLE your_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field VARCHAR(255) NOT NULL
);
```

Run manually: `psql -U conductor_user -d conductor < migrations/001_file.sql`
