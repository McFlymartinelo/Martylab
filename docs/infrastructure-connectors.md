# Connecteurs infrastructure (v0.2)

Martylab expose trois connecteurs d'infrastructure en lecture (actions
Portainer réservées aux rôles `user`+).

## Portainer

```env
PORTAINER_URL=https://portainer.martylab.fr
PORTAINER_API_TOKEN=ptr_...
PORTAINER_ENDPOINT_ID=1
PORTAINER_TIMEOUT_MS=6000
PORTAINER_INSECURE_TLS=false
```

| Route | Description |
|-------|-------------|
| `GET /api/portainer/status` | État Portainer + endpoint Docker |
| `GET /api/portainer/overview` | Conteneurs, images, volumes |
| `POST /api/portainer/containers/:id/start\|stop\|restart` | Actions (user+) |

Crée un **access token** dans Portainer → Mon compte → Access tokens.

## Cloudflare

```env
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_TUNNEL_ID=...
CLOUDFLARE_CHECK_HOSTNAMES=martylab.martylab.fr,orion.martylab.fr,matchday.martylab.fr
CLOUDFLARE_TIMEOUT_MS=6000
```

Token API avec au minimum :
- `Account.Cloudflare Tunnel:Read`
- `User.API Tokens:Read` (vérification)

| Route | Description |
|-------|-------------|
| `GET /api/cloudflare/status` | Tunnel + vérification HTTP des hostnames |

## NAS UGREEN (UGOS)

API privée UGOS — token de session récupéré depuis l'interface web du NAS
(onglet réseau du navigateur, paramètre `token=`).

```env
NAS_URL=https://192.168.x.x:9443
NAS_API_TOKEN=...
NAS_TIMEOUT_MS=6000
NAS_INSECURE_TLS=true
```

| Route | Description |
|-------|-------------|
| `GET /api/nas/status` | CPU/RAM/température, pools de stockage, disques |

**Note :** API non officielle UGREEN — peut changer selon le firmware.

## Comportement

- Connecteur non configuré → état explicite, pas de données inventées.
- Panneaux visibles sur la page **Système** (`/system`).
