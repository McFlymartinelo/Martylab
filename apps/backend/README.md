# @martylab/backend

API Martylab (Node.js + Express + TypeScript + Drizzle + PostgreSQL).

## Scripts

```bash
npm run dev -w @martylab/backend
npm run build -w @martylab/backend
npm run start -w @martylab/backend
npm run db:generate -w @martylab/backend
npm run db:migrate -w @martylab/backend
npm run db:seed -w @martylab/backend
```

## Endpoints (v0.1 foundation)

- `GET /api/health`
- `GET /api/plugins`

## Database

1. Copy `.env.example` to `.env` at the repository root.
2. Start PostgreSQL:

```bash
docker compose up -d postgres
```

3. Apply migrations and seed users:

```bash
npm run db:migrate
npm run db:seed
```

Seeded users in development:

- `alexandre` / `changeme-alexandre` (admin)
- `invite` / `changeme-invite` (guest)

Passwords are hashed with Argon2. Change them via env vars before any shared environment.

The named Docker volume `martylab_postgres_data` is the future attachment point for backups/restore/rotation (not implemented in v0.1).
