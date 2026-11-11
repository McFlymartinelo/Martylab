# Mobile & PWA (v0.7)

Martylab v0.7 turns the portal into an installable Progressive Web App with optional push notifications for Orion and Matchday alerts.

## PWA

The portal uses `vite-plugin-pwa` with an injected service worker (`apps/portal/src/sw.ts`).

- **Manifest** — name, theme color, standalone display, SVG icon
- **Offline shell** — static assets precached via Workbox
- **Auto-update** — new deployments refresh the service worker automatically

### Install

Users can install Martylab from:

- the **install banner** (Chrome / Edge / Android),
- **Paramètres → Application mobile**,
- iOS Safari → Share → **Add to Home Screen**.

## Push notifications

Push uses the Web Push protocol with VAPID keys stored on the backend.

### Server setup

1. Generate VAPID keys on the Debian server:

```bash
npx web-push generate-vapid-keys
```

2. Add to `.env`:

```env
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@martylab.fr
PUSH_NOTIFICATION_INTERVAL_MS=300000
```

3. Deploy the backend. Its entrypoint applies pending migrations automatically:

```bash
docker compose up -d --build backend
```

Check `docker compose logs backend --tail 50` for
`[martylab-migrate] Migrations applied successfully.`

### User flow

1. Open **Paramètres**.
2. Click **Activer les notifications**.
3. Grant browser permission.
4. Optional: **Tester** sends a sample notification.

### Background worker

When VAPID is configured, the backend polls every `PUSH_NOTIFICATION_INTERVAL_MS` (default 5 minutes) for subscribed users:

- Orion warnings / critical alerts
- Matchday warnings (e.g. pending predictions)

A fingerprint avoids duplicate pushes when nothing changed.

### API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/push/public-key` | VAPID public key |
| GET | `/api/push/status` | Server + subscription status |
| POST | `/api/push/status` | Check whether this browser's endpoint is subscribed |
| POST | `/api/push/subscribe` | Save browser subscription |
| POST | `/api/push/unsubscribe` | Remove subscription |
| POST | `/api/push/test` | Send test notification |

All routes require authentication.

## Mobile UX

- Bottom navigation with safe-area padding (`pb-safe`, `pt-safe`)
- Quick search in the mobile topbar
- Assistant: collapsible conversation list on small screens
- Code splitting for heavier pages (assistant, system, matchday, jellyfin, …)
- Dashboard widgets can be hidden and reordered from **Personnaliser**. These
  layout preferences are stored locally per Martylab account and device.
- The notification menu tracks read/unread state locally per account and
  device. It is a lightweight inbox for current Orion and Matchday alerts, not
  a cross-device notification archive.

## Requirements

- **HTTPS** in production (already via Cloudflare Tunnel)
- Push is optional — the app works without VAPID keys
- iOS 16.4+ supports Web Push for installed PWAs
