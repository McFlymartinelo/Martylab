# @martylab/portal

Portail web Martylab.

## Stack

- React
- TypeScript (strict)
- Vite
- Tailwind CSS v4
- shadcn/ui (style `base-nova`, primitives Base UI)
- React Router
- TanStack Query
- Lucide React
- Dark mode via classe `.dark`

## Routes

- `/login` — Connexion (session cookie HttpOnly)
- `/` — Dashboard (authentifié)
- `/apps` — Registre des plugins (authentifié)
- `/system` — Métriques serveur et conteneurs Docker (authentifié)
- `/services` — Gestion Docker (actions user+, logs pour tous)
- `/users` — Gestion des utilisateurs (admin)

## Scripts

```bash
npm run dev -w @martylab/portal
npm run build -w @martylab/portal
npm run typecheck -w @martylab/portal
```

Le serveur de développement proxy `/api` vers `http://localhost:3000`.

## UI

Ajouter un composant shadcn :

```bash
npx shadcn@latest add <component> -c apps/portal
```
