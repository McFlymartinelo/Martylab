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
