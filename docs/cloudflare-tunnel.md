# Cloudflare Tunnel — Martylab

Préparation pour exposer Martylab en HTTPS via Cloudflare Tunnel.

**Domaine cible :** `https://martylab.martylab.fr`

Ce guide ne contient aucun secret. Les tokens Cloudflare restent uniquement sur le serveur Debian.

---

## Architecture

```text
Internet
   │
   ▼
Cloudflare (HTTPS)
   │
   ▼
cloudflared (sur Debian, tunnel existant ou dédié)
   │
   ▼
http://127.0.0.1:3100   ← portal (nginx)
   ├─ /        → SPA
   └─ /api/*   → backend (réseau Docker interne)
                    │
                    ▼
                 postgres
```

Points importants :

- Le Tunnel pointe vers le **portal** uniquement (`:3100`).
- Le backend et PostgreSQL ne sont **pas** exposés publiquement.
- Même origine navigateur : `https://martylab.martylab.fr` et `https://martylab.martylab.fr/api/...`
- Cookies de session : `HttpOnly` + `Secure` + `SameSite=Lax`

---

## Prérequis côté Martylab

Services Docker healthy :

```bash
cd /srv/docker/Martylab
docker compose ps
curl -sS http://127.0.0.1:3100/api/health
```

Mettre à jour `/srv/docker/Martylab/.env` pour le HTTPS public :

```env
CORS_ORIGIN=https://martylab.martylab.fr
COOKIE_SECURE=true
```

Puis redémarrer le backend pour prendre en compte les variables :

```bash
docker compose up -d backend
# ou
docker compose up -d
```

---

## Option A — Tunnel Cloudflare déjà présent (recommandé)

Si Orion / Matchday / etc. utilisent déjà un tunnel Zero Trust :

1. Ouvre **Cloudflare Zero Trust** → **Networks** → **Tunnels**.
2. Sélectionne le tunnel existant du serveur `orion`.
3. **Public Hostname** → **Add** :
   - **Subdomain :** `martylab`
   - **Domain :** `martylab.fr`
   - **Type :** `HTTP`
   - **URL :** `http://127.0.0.1:3100`
4. Enregistre.
5. Vérifie le DNS : `martylab.martylab.fr` doit être un CNAME vers le tunnel (souvent créé automatiquement).

Pas besoin d’ouvrir un port firewall public.

---

## Option B — cloudflared Docker sur le réseau Martylab

Utile seulement si tu préfères que cloudflared joigne `portal:80` en interne.

1. Crée un tunnel + token dans Zero Trust (ne le committe jamais).
2. Sur le serveur, ajoute un override local **non versionné** :

`/srv/docker/Martylab/docker-compose.override.yml` (exemple) :

```yaml
services:
  cloudflared:
    image: cloudflare/cloudflared:latest
    restart: unless-stopped
    command: tunnel --no-autoupdate run
    environment:
      TUNNEL_TOKEN: ${CLOUDFLARE_TUNNEL_TOKEN}
    networks:
      - martylab
```

3. Dans `.env` (serveur uniquement) :

```env
CLOUDFLARE_TUNNEL_TOKEN=...
```

4. Dans la config du tunnel (dashboard), hostname :

- `martylab.martylab.fr` → `http://portal:80`

`docker-compose.override.yml` est ignoré par git (voir `.gitignore`).

---

## Checklist de validation

```bash
# DNS / HTTPS
curl -sSI https://martylab.martylab.fr | head -n 15

# Health via domaine public
curl -sS https://martylab.martylab.fr/api/health

# Login + cookie Secure
curl -sS -c /tmp/ml.cookie -b /tmp/ml.cookie \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://martylab.martylab.fr' \
  -d '{"username":"alexandre","password":"YOUR_PASSWORD"}' \
  https://martylab.martylab.fr/api/auth/login

curl -sS -b /tmp/ml.cookie https://martylab.martylab.fr/api/auth/me
```

Dans le navigateur :

1. Ouvre `https://martylab.martylab.fr`
2. Connecte-toi
3. Vérifie dans DevTools → Application → Cookies :
   - `martylab_session`
   - `HttpOnly`
   - `Secure`
   - `SameSite=Lax`

---

## Dépannage

| Symptôme | Cause probable | Action |
|----------|----------------|--------|
| 502 Bad Gateway | portal down / mauvais service Tunnel | `docker compose ps`, URL Tunnel = `http://127.0.0.1:3100` |
| Login OK en local `:3100` mais pas en HTTPS | `.env` pas mis à jour | `CORS_ORIGIN` + `COOKIE_SECURE=true`, restart backend |
| Cookie absent | `COOKIE_SECURE=true` testé en HTTP | utiliser HTTPS Tunnel |
| 403 Origin | `CORS_ORIGIN` incorrect | doit être exactement `https://martylab.martylab.fr` |
| Auth "indisponible" | backend unhealthy | `docker compose logs backend` |

---

## Hors scope volontaire

- Pas de token Cloudflare dans le dépôt Git
- Pas de modification d’Orion / Matchday / Plex / FileBrowser / Portainer
- Pas d’exposition publique du backend ou de PostgreSQL
