# @martylab/backend

API Martylab (Node.js + Express + TypeScript).

## Scripts

```bash
npm run dev -w @martylab/backend
npm run build -w @martylab/backend
npm run start -w @martylab/backend
```

## Endpoints (v0.1 foundation)

- `GET /api/health`
- `GET /api/plugins`

## Configuration

Variables lues depuis l'environnement (voir `.env.example` à la racine) :

- `PORT` (défaut `3000`)
- `HOST` (défaut `0.0.0.0`)
- `CORS_ORIGIN` (défaut `http://localhost:5173`)
- `LOG_LEVEL` (défaut `info`)
- `NODE_ENV`
