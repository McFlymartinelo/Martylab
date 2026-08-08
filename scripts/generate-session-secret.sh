#!/bin/sh
# Generate a SESSION_SECRET suitable for Martylab production.
set -eu

if command -v openssl >/dev/null 2>&1; then
  openssl rand -base64 48 | tr -d '\n'
  printf '\n'
  exit 0
fi

node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
