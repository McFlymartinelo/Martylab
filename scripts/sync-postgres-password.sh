#!/bin/sh
# Sync martylab DB user password with POSTGRES_PASSWORD from .env
# (required when POSTGRES_PASSWORD was changed after the volume was created).
set -eu

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "ERROR: .env not found in $(pwd)"
  exit 1
fi

# shellcheck disable=SC1091
. ./.env

if [ -z "${POSTGRES_PASSWORD:-}" ]; then
  echo "ERROR: POSTGRES_PASSWORD is not set in .env"
  exit 1
fi

POSTGRES_USER="${POSTGRES_USER:-martylab}"
POSTGRES_DB="${POSTGRES_DB:-martylab}"

echo "Updating PostgreSQL user '${POSTGRES_USER}' password to match .env..."
docker compose exec -T postgres psql -U postgres -d "${POSTGRES_DB}" \
  -c "ALTER USER \"${POSTGRES_USER}\" WITH PASSWORD '${POSTGRES_PASSWORD}';"

echo "Done. Restart backend:"
echo "  docker compose up -d backend"
