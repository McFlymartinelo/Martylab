# Martylab Architecture

## 1. Vision

Martylab is a self-hosted application hub.

It provides a unified interface for independently deployed applications and services.

The core principle is:

> One interface, independent applications.

Martylab does not replace the applications it integrates.

---

## 2. High-Level Architecture

```text
                         Internet
                            │
                            ▼
                    Cloudflare Tunnel
                            │
                            ▼
              https://martylab.martylab.fr
                            │
                            ▼
                  ┌───────────────────┐
                  │ Martylab Portal   │
                  │ nginx + React SPA │
                  │ host :3100        │
                  └─────────┬─────────┘
                            │ /api (same origin)
                            ▼
                  ┌───────────────────┐
                  │ Martylab Backend  │
                  │ Express + TS      │
                  │ Docker internal   │
                  └─────────┬─────────┘
                            │
                            ▼
                  ┌───────────────────┐
                  │ PostgreSQL 17     │
                  │ Docker internal   │
                  │ volume persisted  │
                  └───────────────────┘
```

Future plugin integrations remain independent:

```text
Martylab Backend
   ├─ Orion Plugin    → Orion API
   ├─ Matchday Plugin → Matchday API
   └─ Jellyfin Plugin → Jellyfin API
```

---

## 3. Production networking (v0.1)

| Service | Published on host | Notes |
|---------|-------------------|--------|
| portal | `3100 -> 80` | Only public entry (via Tunnel later) |
| backend | no | Reached by portal nginx as `backend:3000` |
| postgres | no | Reached by backend as `postgres:5432` |

Details for Cloudflare Tunnel setup: [`docs/cloudflare-tunnel.md`](docs/cloudflare-tunnel.md).

---

## 4. Authentication

- Server-side sessions stored in PostgreSQL
- Session id delivered via HttpOnly cookie
- `COOKIE_SECURE=true` required for HTTPS production
- Authorization enforced in the backend

---

## 5. Console (ADR-021, ADR-023)

```text
Admin browser + second facteur vérifié
  ├─ POST /api/console/execute   → allowlist → collecteurs / connecteurs
  └─ WS  /api/console/terminal   → docker exec TTY → conteneur autorisé
```

- Rôle `admin` obligatoire, vérifié à chaque requête et pendant la poignée de
  main WebSocket (cookie de session + `Origin`).
- Le terminal exige en plus `session.mfa_verified = true` : un second facteur
  TOTP a été validé lors de la connexion de cette session.
- Aucun `child_process`, aucun shell hôte, aucun `sudo` dans le backend.
- Chaque exécution et chaque session terminal sont écrites dans
  `console_audit`.
- Le terminal ne peut cibler qu'un conteneur Docker existant ; `CONSOLE_TERMINAL_CONTAINERS`
  restreint la liste aux noms autorisés.
- L'accès machine complet, si souhaité, passe par le service `toolbox`
  (profil Compose optionnel) : c'est un conteneur jetable qui porte les
  montages, jamais le backend.
- `CONSOLE_TERMINAL_ENABLED=false` désactive le canal WebSocket.
