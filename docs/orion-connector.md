# Connecteur Orion

Martylab interroge Orion via son API HTTP publique. Orion reste
totalement indépendant : Martylab ne touche jamais aux tokens Netatmo,
Hue, Tuya, etc.

## Configuration

Dans le `.env` du backend Martylab :

```env
ORION_URL=https://orion.martylab.fr
ORION_API_KEY=              # optionnel — non implémenté côté Orion pour l'instant
ORION_TIMEOUT_MS=6000
```

En développement local (Orion sur le port 4000) :

```env
ORION_URL=http://localhost:4000
```

## Endpoints Martylab

| Route | Description |
|-------|-------------|
| `GET /api/orion/status` | Connecteur configuré + Orion joignable |
| `GET /api/orion/climate` | Température / humidité intérieure et extérieure |

## Endpoints Orion utilisés

| Route Orion | Usage |
|-------------|-------|
| `GET /api/health` | Vérification de disponibilité |
| `GET /api/netatmo` | Données station Netatmo (température, humidité, CO₂) |

## Comportement

- Si `ORION_URL` est absent : le panneau **Maison** affiche « non configuré ».
- Si Orion est hors ligne : état explicite, aucune donnée inventée.
- Si Netatmo échoue côté Orion (502) : « données indisponibles ».
- Le plugin Orion passe à `enabled: true` au démarrage si le health check réussit.

## Sécurité

Orion n'expose pas encore d'authentification API. L'accès repose sur le
réseau (Cloudflare Tunnel, LAN). `ORION_API_KEY` est réservé pour une
future authentification serveur-à-serveur.
