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
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/plugins` (authenticated)

## Database (local tooling)

```bash
# From repo root, with DATABASE_URL pointing at a reachable Postgres
npm run db:migrate
npm run db:seed
```

Seeded users in development defaults:

- `alexandre` / `changeme-alexandre` (admin)
- `invite` / `changeme-invite` (guest)

## Docker production

Backend image:

- multi-stage build
- runs migrations on startup
- listens on container port `3000`
- not published on the host (reached via portal nginx `/api` proxy)

See root `compose.yaml` and `.env.example`.
