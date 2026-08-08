#!/usr/bin/env bash
set -euo pipefail

# Backup Martylab PostgreSQL (production Debian).
# Usage: ./scripts/backup-postgres.sh [output-dir]
#
# Requires: docker compose, running postgres service.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="${1:-${ROOT_DIR}/backups}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="${OUTPUT_DIR}/martylab-postgres-${TIMESTAMP}.sql.gz"

mkdir -p "${OUTPUT_DIR}"

cd "${ROOT_DIR}"

docker compose exec -T postgres pg_dump \
  -U "${POSTGRES_USER:-martylab}" \
  -d "${POSTGRES_DB:-martylab}" \
  --no-owner \
  --no-acl \
  | gzip > "${BACKUP_FILE}"

echo "Backup written to ${BACKUP_FILE}"
