# Database Setup Guide

PostgreSQL setup and migrations.
## Prerequisites

- Docker Desktop installed
- Node.js installed
- PostgreSQL client (optional): `psql` or pgAdmin for GUI access

## Quick Start

### 1. Setup Environment Variables

Copy the content in `.env.example` to the end of `.env`.

Download and install PostgreSQL client (e.g., `psql`, or `pgAdmin` for GUI) if you want to connect to the database from your host machine.

Download and install Docker Desktop if you haven't already.

Run `npm install` in the root directory to install dependencies.

### 2. Start the Database

Start the PostgreSQL container:
- `npm run db:start`
- Or: `docker compose up -d`

The container will automatically:
- Create PostgreSQL 16 instance on port 5433
- Run all migration scripts in `database/migrations/`
- Initialize the `conductor_tool` database with tables and default roles
- Persist data in a Docker volume

### 3. Verify Database is Running

Check status: `npm run db:logs` or `docker compose ps`

### 4. Test Connection

Run the test script: `npm run db:test`

This verifies the database connection and queries sample data.

## Database Connection

Connection string (already in `.env`):
```
postgresql://conductor_admin:conductor_dev_password@localhost:5433/conductor_tool
```

Access via `process.env.DATABASE_URL` in your Node.js backend.

## Usage Examples

### Connect from CLI

Using docker exec: `docker compose exec postgres psql -U conductor_admin -d conductor_tool`

From host machine: `psql -h localhost -p 5433 -U conductor_admin -d conductor_tool`

### Query from Backend

Use the provided utilities in `backend/src/utils/db.js`:
- `query(text, params)` - Execute SQL queries
- `getClient()` - Get client for transactions
- `testConnection()` - Verify connection

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run db:start` | Start database container |
| `npm run db:stop` | Stop database container |
| `npm run db:reset` | Delete all data and restart fresh |
| `npm run db:logs` | View database logs |
| `npm run db:test` | Test database connection |

- `migrations/` - Numbered SQL files for schema (001, 002, 003...)
- `seeds/` - Sample dev data
## Migration Scripts

Located in `database/migrations/`, executed in order on first startup:

1. **001_init_db.sql** - Create database and enable pgcrypto extension
2. **002_init_tables.sql** - Create all tables with relationships
3. **003_init_data.sql** - Insert default roles

## Pattern
To add new migrations:
- Create numbered SQL file (e.g., `004_add_feature.sql`)
- Run `npm run db:reset` to apply

## Troubleshooting

**Port conflict**: Change `POSTGRES_PORT` in `.env` to another port (e.g., 5434), then update `DATABASE_URL` accordingly.

**Connection refused**: Ensure Docker is running, check container health with `docker compose ps`, and wait a few seconds after starting.

**Reset everything**: `npm run db:reset` or `docker compose down -v && docker compose up -d`

## Production Notes

⚠️ Before deploying:
- Change all passwords in `.env`
- Use strong, randomly generated passwords
- Enable SSL connections
- Configure backups
- Restrict network access
