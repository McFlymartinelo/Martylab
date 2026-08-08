#!/bin/sh
# Interactive checklist to harden Martylab production secrets on Debian.
# Run from the repo root on the server: ./scripts/rotate-production-secrets.sh
set -eu

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "ERROR: .env not found in $(pwd)"
  exit 1
fi

echo "=== Martylab — rotation des secrets de production ==="
echo ""
echo "Ce script ne modifie pas automatiquement tous les secrets."
echo "Il génère des valeurs et guide les étapes à faire sur le serveur."
echo ""

NEW_SESSION_SECRET="$(./scripts/generate-session-secret.sh | tr -d '\n')"
echo "1) SESSION_SECRET (copie dans .env) :"
echo "   SESSION_SECRET=${NEW_SESSION_SECRET}"
echo ""

echo "2) PostgreSQL — si tu changes POSTGRES_PASSWORD dans .env :"
echo "   ./scripts/sync-postgres-password.sh"
echo "   puis aligne DATABASE_URL avec le même mot de passe."
echo ""

echo "3) Comptes utilisateurs — après redéploiement, change les mots de passe"
echo "   des comptes alexandre / invite via Martylab → Utilisateurs."
echo ""

read -r -p "As-tu mis à jour SESSION_SECRET dans .env ? [o/N] " confirm
case "$confirm" in
  o|O|y|Y|oui|Oui|OUI)
    echo "Redémarrage du backend pour prendre en compte SESSION_SECRET..."
    docker compose up -d backend
    echo ""
    echo "Les sessions existantes sont invalidées (normal)."
    echo "Reconnecte-toi sur https://martylab.martylab.fr"
    ;;
  *)
    echo "Aucun redémarrage. Mets à jour .env puis exécute :"
    echo "  docker compose up -d backend"
    ;;
esac
