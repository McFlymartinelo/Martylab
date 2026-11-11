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

## 7. Console, terminal conteneur et second facteur

La Console (ADR-021, ADR-023) est réservée aux administrateurs :

- commandes typées : allowlist, confirmation explicite, audit en base ;
- terminal : `docker exec` dans un conteneur, jamais le shell de l'hôte ;
- second facteur : le terminal exige une session ouverte avec un code TOTP
  validé (`/api/auth/mfa/verify`).

Vérifications :

- `/var/run/docker.sock` reste monté en lecture seule dans le backend ;
- nginx relaie bien `Upgrade`/`Connection` sur `/api/console/terminal` ;
- le terminal est désactivé par défaut ; définir `CONSOLE_TERMINAL_ENABLED=true` uniquement si nécessaire ;
- `CONSOLE_TERMINAL_CONTAINERS` limite les conteneurs ouvrables (ex. `martylab-toolbox`) ;
- au moins un administrateur a activé le TOTP, sinon le terminal reste fermé ;
- les lignes `console_audit` sont conservées avec les sauvegardes PostgreSQL.

Le montage `:ro` empêche de remplacer le fichier socket, mais ne limite pas les
opérations que l'API Docker accepte via ce socket. L'accès au socket reste donc
un privilège élevé sur l'hôte. La Console et le terminal sont réservés aux
administrateurs ; ne publie pas le backend et limite les comptes admin.

## 8. Accès machine complet (profil `toolbox`)

Le service `toolbox` de `compose.yaml` est une porte root assumée :

```bash
docker compose --profile toolbox up -d toolbox
```

- `/` de l'hôte est monté dans `/host` en lecture-écriture ;
- `pid: host` : `htop` voit tous les processus ;
- socket Docker disponible : `docker ps`, `docker logs`, etc. ;
- `network_mode: none` : aucun port, aucun accès réseau.

Il n'est jamais démarré par `docker compose up -d`. Conséquences à accepter :

- toute personne qui obtient une session admin **avec second facteur** obtient
  root sur l'hôte (via `chroot /host`) ;
- supprimer le conteneur (`docker compose --profile toolbox down toolbox`)
  révoque cet accès immédiatement ;
- ne jamais publier de port sur ce conteneur, ni l'ajouter au réseau
  `martylab`.
