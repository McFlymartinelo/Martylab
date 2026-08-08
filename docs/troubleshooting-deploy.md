# Dépannage déploiement (Debian / Docker Compose)

## Backend `unhealthy` ou `dependency failed to start`

### 1. Lire les logs (indispensable)

```bash
cd /srv/docker/Martylab
docker compose logs backend --tail 100
```

Messages typiques :

| Log | Cause | Action |
|-----|-------|--------|
| `[martylab-migrate] password authentication failed` | `DATABASE_URL` ne correspond pas au mot de passe du volume PostgreSQL | Voir section ci-dessous |
| `[martylab-backend] Failed to start: Invalid environment` | Variable `.env` invalide | Corriger la variable indiquée |
| `SESSION_SECRET is required` | Secret manquant ou &lt; 32 caractères | Définir un secret long dans `.env` |

### 2. Mot de passe PostgreSQL (cause la plus fréquente)

PostgreSQL **ne change pas** le mot de passe d'un utilisateur existant quand vous modifiez `POSTGRES_PASSWORD` dans `.env`. Le volume `martylab_postgres_data` conserve le mot de passe du **premier** déploiement.

**Symptôme :** le backend s'arrête en quelques secondes, migrations en échec.

**Vérifier :**

```bash
grep -E '^(POSTGRES_PASSWORD|DATABASE_URL)=' .env
```

Le mot de passe dans `DATABASE_URL` doit être **identique** à celui réellement stocké dans PostgreSQL.

**Corriger** (sans supprimer le volume) :

```bash
chmod +x scripts/sync-postgres-password.sh
./scripts/sync-postgres-password.sh
docker compose up -d backend
docker compose logs backend --tail 30
```

**Alternative :** remettre dans `.env` l'ancien mot de passe (celui utilisé au premier `docker compose up`).

> Ne jamais exécuter `docker compose down -v` en production sauf si vous acceptez de perdre les données.

### 3. Test manuel des migrations

```bash
docker compose run --rm --no-deps backend node dist/db/migrate.js
```

### 4. Test du healthcheck

```bash
docker compose up -d backend
docker compose exec backend wget -qO- http://127.0.0.1:3000/api/health/live
```

Réponse attendue : JSON avec `"status":"ok"`.

### 5. Variables `.env` à vérifier

```env
CORS_ORIGIN=https://martylab.martylab.fr
DATABASE_URL=postgresql://martylab:<mot-de-passe>@postgres:5432/martylab
SESSION_SECRET=<au-moins-32-caracteres-aleatoires>
DOCKER_GID=989
ORION_URL=https://orion.martylab.fr
```

- Pas de guillemets autour des valeurs (`ORION_URL=https://...`, pas `"https://..."`).
- `ORION_URL` peut rester vide si Orion n'est pas encore configuré.
