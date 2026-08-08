# Connecteur Jellyfin

Martylab interroge Jellyfin via son API HTTP REST. Jellyfin reste totalement
indépendant : Martylab ne touche jamais à la base de données Jellyfin.

Le panneau dashboard et la page `/jellyfin` affichent bibliothèques, lecture
en cours, ajouts récents, films, séries et sessions actives.

## Configuration

Dans le `.env` du backend Martylab :

```env
JELLYFIN_URL=https://jellyfin.martylab.fr
JELLYFIN_PUBLIC_URL=https://jellyfin.martylab.fr
JELLYFIN_API_KEY=your-api-key-here
JELLYFIN_TIMEOUT_MS=6000
```

### Utilisateur Jellyfin (optionnel)

Par défaut, Martylab résout l'utilisateur via `GET /Users/Me` avec la clé API.
Pour forcer un utilisateur précis :

```env
JELLYFIN_USER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Clé API Jellyfin

Créer une clé API depuis le tableau de bord Jellyfin (utilisateur dédié
recommandé, ex. `martylab`). La clé reste côté serveur uniquement.

## Endpoints Martylab

| Route | Description |
|-------|-------------|
| `GET /api/jellyfin/status` | Connecteur configuré + Jellyfin joignable |
| `GET /api/jellyfin/summary` | Résumé pour le dashboard |
| `GET /api/jellyfin/page` | Page complète (bibliothèques, médias, sessions) |
| `GET /api/jellyfin/items/:id/image` | Proxy d'affiche (évite d'exposer la clé API) |

Toutes les routes requièrent une session Martylab valide.

## Endpoints Jellyfin utilisés

| Route Jellyfin | Usage |
|----------------|-------|
| `GET /System/Info/Public` | Vérification de disponibilité |
| `GET /System/Info` | Informations serveur |
| `GET /Users/Me` | Résolution de l'utilisateur API |
| `GET /UserViews` | Bibliothèques |
| `GET /UserItems/Resume` | Continuer la lecture |
| `GET /UserItems/Latest` | Ajouts récents |
| `GET /Items` | Films et séries |
| `GET /Sessions` | Lectures actives |
| `GET /Items/{id}/Images/Primary` | Affiches (via proxy Martylab) |

## Comportement

- Si `JELLYFIN_URL` ou `JELLYFIN_API_KEY` est absent : panneau « non configuré ».
- Si Jellyfin est hors ligne : état explicite, aucune donnée inventée.
- Le plugin Jellyfin passe à `enabled: true` quand URL + clé API sont configurés.
- Les affiches passent par Martylab pour ne pas exposer `JELLYFIN_API_KEY` au frontend.

## Sécurité

- `JELLYFIN_API_KEY` reste dans le `.env` serveur uniquement.
- Martylab ne transmet jamais cette clé au navigateur.
- L'API proxy s'appuie sur la session Martylab.
