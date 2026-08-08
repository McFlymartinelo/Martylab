# Martylab

Plateforme personnelle auto-hébergée — hub unifié pour orchestrer des applications
indépendantes (Orion, Matchday, Jellyfin, etc.) via des plugins et connecteurs.

**Production :** https://martylab.martylab.fr

## Stack

| Couche | Technologies |
|--------|--------------|
| Portail | React, Vite, Tailwind CSS v4, shadcn/ui, TanStack Query |
| Backend | Node.js, Express, TypeScript, Drizzle ORM |
| Base de données | PostgreSQL 17 |
| Infra | Docker Compose, Cloudflare Tunnel |

## Structure du dépôt

```text
apps/
  portal/     # Interface web (React)
  backend/    # API Martylab (Express)
packages/
  shared/     # Types partagés frontend / backend
docker/       # Dockerfiles et outils dev
docs/         # Documentation opérationnelle
compose.yaml  # Stack production (Debian)
```

## Démarrage rapide — développement local (Windows)

### Prérequis

- Node.js ≥ 20
- Docker Desktop (pour PostgreSQL local)

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer l'environnement

```bash
cp .env.example .env
```

Adapter pour le dev local :

```env
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
COOKIE_SECURE=false
DATABASE_URL=postgresql://martylab:martylab-dev-password@localhost:5432/martylab
```

### 3. Démarrer PostgreSQL (dev)

```bash
docker compose -f docker/dev/compose.postgres.yml up -d
npm run db:migrate
npm run db:seed
```

### 4. Lancer le backend et le portail

```bash
npm run dev:backend   # http://localhost:3000
npm run dev:portal    # http://localhost:5173
```

### Comptes seed (développement)

| Utilisateur | Mot de passe par défaut | Rôle |
|-------------|-------------------------|------|
| `alexandre` | `changeme-alexandre` | admin |
| `invite` | `changeme-invite` | guest |

**Change ces mots de passe avant toute exposition publique.**

## Déploiement production (Debian)

```bash
git pull
docker compose up -d --build
```

Le portail est exposé sur `:3100` (configurable via `PORTAL_HOST_PORT`).
Le backend et PostgreSQL restent sur le réseau Docker interne.

### Variables d'environnement essentielles

Voir `.env.example`. En production :

- `CORS_ORIGIN` doit correspondre au domaine réel (ex. `https://martylab.martylab.fr`)
- `SESSION_SECRET` — secret aléatoire ≥ 32 caractères
- `POSTGRES_PASSWORD` — mot de passe fort
- `COOKIE_SECURE=true` (HTTPS)

### Métriques serveur et Docker (v0.2)

Pour des métriques **hôte** (CPU, RAM, disque du serveur Debian) et la liste
des conteneurs Docker, monter les chemins suivants dans `compose.yaml` :

```yaml
backend:
  volumes:
    - /proc:/host/proc:ro
    - /sys:/host/sys:ro
    - /:/host/root:ro
    - /var/run/docker.sock:/var/run/docker.sock:ro
  environment:
    HOST_PROC_PREFIX: /host/proc
    HOST_SYS_PREFIX: /host/sys
    HOST_ROOT_PATH: /host/root
    DOCKER_SOCKET_PATH: /var/run/docker.sock
```

Sans ces montages, le backend remonte les métriques du **conteneur** lui-même
(comportement par défaut, sans données inventées).

## Scripts utiles

```bash
npm run build          # Build complet (shared + portal + backend)
npm run typecheck      # Vérification TypeScript
npm run db:migrate     # Migrations PostgreSQL
npm run db:seed        # Comptes initiaux
```

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — architecture technique
- [ROADMAP.md](./ROADMAP.md) — feuille de route
- [DECISIONS.md](./DECISIONS.md) — décisions d'architecture (ADR)
- [AGENTS.md](./AGENTS.md) — règles de développement
- [docs/cloudflare-tunnel.md](./docs/cloudflare-tunnel.md) — tunnel Cloudflare
- [docs/backup-postgres.md](./docs/backup-postgres.md) — sauvegarde PostgreSQL

## API (v0.1 / v0.2)

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /api/health` | — | Santé API + base de données |
| `POST /api/auth/login` | — | Connexion |
| `POST /api/auth/logout` | session | Déconnexion |
| `GET /api/auth/me` | session | Utilisateur courant |
| `GET /api/plugins` | session | Registre des plugins |
| `GET /api/users` | admin | Liste des utilisateurs |
| `POST /api/users` | admin | Créer un utilisateur |
| `PATCH /api/users/:id` | admin | Modifier un utilisateur |
| `DELETE /api/users/:id` | admin | Supprimer un utilisateur |
| `GET /api/system/metrics` | session | CPU, RAM, disque, uptime |
| `GET /api/docker/containers` | session | Liste des conteneurs Docker |

## Licence

Projet personnel — usage privé.
