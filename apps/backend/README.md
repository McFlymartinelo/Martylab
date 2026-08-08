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
- `GET /api/users` (admin)
- `POST /api/users` (admin)
- `PATCH /api/users/:userId` (admin)
- `DELETE /api/users/:userId` (admin)
- `GET /api/system/metrics` (authenticated)
- `GET /api/docker/containers` (authenticated)
- `GET /api/docker/containers/:containerId/logs` (authenticated)
- `POST /api/docker/containers/:containerId/start` (user+)
- `POST /api/docker/containers/:containerId/stop` (user+)
- `POST /api/docker/containers/:containerId/restart` (user+)
- `GET /api/orion/status` (authenticated)
- `GET /api/orion/climate` (authenticated)

## Database (local Windows dev)

Production PostgreSQL is provisioned by the root `compose.yaml` on Debian and
is never published on the host. For local Windows development (`npm run dev`,
outside Docker), start a dedicated dev-only Postgres instead:

```bash
# From repo root — starts Postgres bound to 127.0.0.1:5432 only
docker compose -f docker/dev/compose.postgres.yml up -d

# Copy `.env.example` to `.env` at the repo root and adjust for local dev
# (DATABASE_URL=postgresql://martylab:martylab-dev-password@localhost:5432/martylab,
# CORS_ORIGIN=http://localhost:5173, COOKIE_SECURE=false)

npm run db:migrate -w @martylab/backend
npm run db:seed -w @martylab/backend
```

Stop it with `docker compose -f docker/dev/compose.postgres.yml down` (add
`-v` to also wipe local dev data).

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
