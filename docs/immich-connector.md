# Connecteur Immich

Martylab interroge Immich via son API HTTP REST. Immich reste totalement
indépendant : Martylab ne touche jamais aux fichiers ni à la base de données
Immich.

Le panneau dashboard et la page `/photos` affichent les statistiques et albums
des deux instances configurées :

- **Photos** — bibliothèque personnelle (`photos`)
- **Photos partagées** — bibliothèque pour le partage (`photosshared`)

## Configuration

Dans le `.env` du backend Martylab :

```env
# Instance personnelle
PHOTOS_URL=https://photos.martylab.fr
PHOTOS_PUBLIC_URL=https://photos.martylab.fr
PHOTOS_API_KEY=your-api-key-here

# Instance partagée
PHOTOSSHARED_URL=https://photosshared.martylab.fr
PHOTOSSHARED_PUBLIC_URL=https://photosshared.martylab.fr
PHOTOSSHARED_API_KEY=your-api-key-here

IMMICH_TIMEOUT_MS=6000
```

### Accès réseau Docker

Si MartyLab et Immich tournent sur le même serveur, le backend peut joindre
les containers par leur nom :

```env
PHOTOS_URL=http://photos:2283
PHOTOSSHARED_URL=http://photosshared:2283
```

Les URLs publiques (`PHOTOS_PUBLIC_URL`, `PHOTOSSHARED_PUBLIC_URL`) restent
les adresses HTTPS utilisées par le navigateur pour ouvrir Immich.

### Clé API Immich

Créer une clé API depuis chaque instance Immich (utilisateur dédié
recommandé, ex. `martylab`). La clé reste côté serveur uniquement.

## Endpoints Martylab

| Route | Description |
|-------|-------------|
| `GET /api/immich/status` | État des deux instances |
| `GET /api/immich/summary` | Résumé pour le dashboard |
| `GET /api/immich/page` | Page complète (stats + albums) |
| `GET /api/immich/:instanceId/assets/:assetId/thumbnail` | Proxy miniature |

`instanceId` : `photos` ou `photosshared`.

Toutes les routes requièrent une session Martylab valide.

## Endpoints Immich utilisés

| Route Immich | Usage |
|--------------|-------|
| `GET /api/server/ping` | Vérification de disponibilité |
| `GET /api/server/version` | Version du serveur |
| `GET /api/assets/statistics` | Statistiques photos/vidéos |
| `GET /api/albums/statistics` | Statistiques albums |
| `GET /api/albums` | Liste des albums |
| `GET /api/assets/{id}/thumbnail` | Miniatures (via proxy Martylab) |

## Comportement

- Si aucune URL + clé API n'est configurée : panneau « non configuré ».
- Chaque instance est affichée séparément (configurée, hors ligne, connectée).
- Le plugin Immich passe à `enabled: true` dès qu'une instance est configurée.
- Les miniatures passent par MartyLab pour ne pas exposer les clés API.

## Partage avec des amis

Le partage public se fait directement dans Immich (liens de partage d'album).
MartyLab affiche l'état et les albums ; pour créer ou gérer un lien public,
ouvre l'instance **Photos partagées** via le bouton « Ouvrir Immich ».

## Sécurité

- Les clés API restent dans le `.env` serveur uniquement.
- MartyLab ne transmet jamais ces clés au navigateur.
- L'API proxy s'appuie sur la session Martylab.
