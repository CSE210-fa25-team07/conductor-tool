# Conductor Tool - Database Quick Guide

## Setup (One-Time)

```bash
cp .env.example .env    # Create config (edit POSTGRES_PORT if you have conflicts)
docker compose up -d    # Start database
```

## Connection Info

- **URL:** `postgresql://conductor_user:conductor_pass@localhost:5432/conductor`
- **PgAdmin:** http://localhost:5050 (login: `admin@conductor.local` / `admin`)

## Common Commands

```bash
docker compose up -d              # Start database
docker compose down               # Stop (keeps data)
docker compose down -v            # Stop and delete all data
docker compose logs -f postgres   # View logs
docker compose ps                 # Check status
docker exec -it conductor-postgres psql -U conductor_user -d conductor  # CLI access
```

## Troubleshooting

- **Port conflict:** Edit `POSTGRES_PORT=5433` in `.env`
- **Won't start:** Check logs with `docker compose logs postgres`
- **Connection failed:** Verify `docker compose ps` shows containers running

Full schema auto-loads from `database/init.sql`. See `META/TABLES.md` for table documentation.
