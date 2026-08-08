#!/bin/sh
set -eu

echo "Running database migrations..."
if ! node dist/db/migrate.js; then
  echo "ERROR: database migrations failed."
  echo "Check that DATABASE_URL matches the existing postgres volume credentials."
  echo "Example: postgresql://martylab:<POSTGRES_PASSWORD>@postgres:5432/martylab"
  exit 1
fi

echo "Starting Martylab backend..."
exec node dist/index.js
