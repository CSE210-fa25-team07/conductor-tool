# Database Setup Guide

PostgreSQL database with Prisma ORM integration.

## Prerequisites

- Docker Desktop installed
- Node.js installed
- PostgreSQL client (optional): `psql` or pgAdmin for GUI access

## First Time Setup

Follow these steps when setting up the project for the first time:

### 1. Install Dependencies

```bash
npm install
```

This installs all dependencies including Prisma and the PostgreSQL client.

### 2. Setup Environment Variables

Copy the content from `.env.example` and append it to your `.env` file (or create `.env` if it doesn't exist):

```bash
# The .env file should include:
DATABASE_URL=postgresql://conductor_admin:conductor_dev_password@localhost:5433/conductor_tool
```

### 3. Start the Database

Start the PostgreSQL container:

```bash
npm run db:start
```

This will:
- Create PostgreSQL 16 instance on port 5433
- Run all migration scripts in `database/migrations/`
- Initialize the `conductor_tool` database with tables and default roles
- Persist data in a Docker volume

### 4. Generate Prisma Client

Generate the Prisma Client from the schema:

```bash
npm run db:generate
```

This creates type-safe database access functions based on your schema.

### 5. (Optional) Open Prisma Studio

Explore your database with a visual interface:

```bash
npm run db:studio
```

Opens a browser-based GUI at http://localhost:5555 to view and edit data.

---

## Daily Development Workflow

For ongoing development after initial setup:

### Starting Work

```bash
# Start the database (if not already running)
npm run db:start

# Check that it's running
npm run db:logs
```

### Making Database Changes

Do not modify the database schema directly. Instead, the entire team
should come to an agreement.

(For DB administrators only) When you modify the database schema:

1. Update SQL migration files in `database/migrations/`
2. Reset the database to apply changes:
   ```bash
   npm run db:reset
   ```
3. Pull the updated schema into Prisma:
   ```bash
   npm run db:pull
   ```
4. Regenerate Prisma Client:
   ```bash
   npm run db:generate
   ```

### Viewing Data

```bash
# Open Prisma Studio (visual database browser)
npm run db:studio

# Or use psql
docker compose exec postgres psql -U conductor_admin -d conductor_tool
```

### Ending Work

```bash
# Stop the database (optional - you can leave it running)
npm run db:stop
```

