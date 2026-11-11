# Sécurisation production Martylab

Checklist à appliquer sur le serveur Debian (`/srv/docker/Martylab`).

## 1. SESSION_SECRET

Génère une valeur aléatoire (≥ 32 caractères) :

```bash
chmod +x scripts/generate-session-secret.sh
./scripts/generate-session-secret.sh
```

Colle le résultat dans `.env` :

```env
SESSION_SECRET=<valeur-générée>
```

Puis redémarre le backend :

```bash
docker compose up -d backend
```

Toutes les sessions en cours seront invalidées.

## 2. PostgreSQL

Utilise un mot de passe fort dans `.env` :

```env
POSTGRES_PASSWORD=<mot-de-passe-fort>
DATABASE_URL=postgresql://martylab:<même-mot-de-passe>@postgres:5432/martylab
```

Si le volume PostgreSQL existait déjà avec un autre mot de passe :

```bash
chmod +x scripts/sync-postgres-password.sh
./scripts/sync-postgres-password.sh
```

## 3. Comptes utilisateurs

Les comptes seed (`alexandre`, `invite`) ont des mots de passe par défaut en
développement. En production :

1. Connecte-toi en tant qu’administrateur
2. Ouvre **Utilisateurs**
3. Modifie chaque compte et définis un mot de passe fort

Ne commite jamais de mots de passe dans Git.

## 4. Script guidé

```bash
chmod +x scripts/rotate-production-secrets.sh
./scripts/rotate-production-secrets.sh
```

## 5. Vérifications

- `COOKIE_SECURE=true` avec HTTPS (Cloudflare Tunnel)
- `CORS_ORIGIN` = l’URL publique exacte du portail
- `.env` absent du dépôt Git (déjà dans `.gitignore`)
- Accès SSH au serveur limité

## 6. Sauvegardes

Voir [backup-postgres.md](./backup-postgres.md) pour la sauvegarde PostgreSQL.

## 7. Console et terminal conteneur

La Console (ADR-021) est réservée aux administrateurs :

- commandes typées : allowlist, confirmation explicite, audit en base ;
- terminal : `docker exec` dans un conteneur, jamais le shell de l'hôte.

Vérifications :

- `/var/run/docker.sock` reste monté en lecture seule dans le backend ;
- nginx relaie bien `Upgrade`/`Connection` sur `/api/console/terminal` ;
- `CONSOLE_TERMINAL_ENABLED=false` si l'accès terminal n'est pas souhaité ;
- les lignes `console_audit` sont conservées avec les sauvegardes PostgreSQL.
