#!/bin/sh
set -eu

echo "[entrypoint] Running database migrations..."
if ! node dist/db/migrate.js; then
  echo "[entrypoint] ERROR: database migrations failed."
  echo "[entrypoint] Run: docker compose logs backend --tail 50"
  echo "[entrypoint] See: docs/troubleshooting-deploy.md"
  exit 1
fi

echo "[entrypoint] Starting Martylab backend..."
exec node dist/index.js
