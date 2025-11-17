# Conductor Tool - Complete Setup Guide

## Quick Start

```bash
npm install                          # Install dependencies (pg, vitest, etc.)
docker compose up -d                 # Start PostgreSQL database
docker exec -i conductor-postgres psql -U conductor_user conductor < database/seeds/001_sample_data.sql
npm start                            # Start server at http://localhost:8000
npm test                             # Run tests
```

## What's Included

✅ **Database** - PostgreSQL , 17 tables, sample data
✅ **Backend** - Express API with repositories, services, controllers for roles/enrollments
✅ **Frontend** - Role state management, API clients, conditional rendering components
✅ **Tests** - Vitest tests for backend services and frontend components

## Sample Users

- `powell@ucsd.edu` (Professor)
- `ta_alice@ucsd.edu` (TA)
- `student1@ucsd.edu` (Team Lead)

See [database/seeds/001_sample_data.sql](database/seeds/001_sample_data.sql) for complete list.
