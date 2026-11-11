# Intégration du kit dans le portail

**Statut : appliqué** dans `apps/portal` le 11 novembre 2026 (favicon, icônes PWA,
`theme_color`, `brand-mark.tsx`). Ce document reste la référence de ce qui a été
changé et de ce qu'il faut vérifier après coup.

## 1. Icônes copiées

```bash
mkdir -p apps/portal/public/icons
cp docs/brand/assets/icons/martylab-pwa-192.png            apps/portal/public/icons/icon-192.png
cp docs/brand/assets/icons/martylab-pwa-512.png            apps/portal/public/icons/icon-512.png
cp docs/brand/assets/icons/martylab-app-icon-maskable-1024.png apps/portal/public/icons/icon-maskable-1024.png
cp docs/brand/assets/icons/martylab-apple-touch-icon-180.png   apps/portal/public/icons/apple-touch-icon.png
cp docs/brand/assets/icons/martylab-favicon.svg            apps/portal/public/favicon.svg
```

`apps/portal/public/favicon.svg` contenait une icône générique violette : elle est
remplacée par `martylab-favicon.svg`.

## 2. Manifest PWA

```json
{
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-maskable-1024.png", "sizes": "1024x1024", "type": "image/png", "purpose": "maskable" },
    { "src": "/favicon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any" }
  ],
  "theme_color": "#0C1116",
  "background_color": "#0C1116"
}
```

**Décision appliquée** : `theme_color` passe de `#6fc46f` à `#0C1116`. L'ancienne
valeur ne correspondait à aucun jeton et colorait la barre du navigateur en vert ; la
couleur de fond graphite est cohérente avec l'écran de démarrage. Si le vert est
rétabli un jour, utiliser `#7EB66B` (accent sombre), jamais `#6fc46f`.

Dans `apps/portal/vite.config.ts`, `includeAssets` inclut aussi `icons/*.png` et
`workbox.globPatterns` précache les `.png`, sinon les icônes ne sont pas disponibles
hors ligne.

## 3. `apps/portal/index.html`

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
<meta name="theme-color" content="#0C1116" />
```

## 4. `brand-mark.tsx`

Le composant d'origine (4 carrés 13 × 13, rayon 4, opacité 0,32) ne correspondait pas
aux proportions du logo. Il utilise désormais la géométrie officielle (module 12,
gouttière 4, rayon 3,5) sans opacité :

```tsx
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <rect x="2" y="2" width="12" height="12" rx="3.5" fill="currentColor" />
      <rect x="18" y="2" width="12" height="12" rx="3.5" fill="currentColor" />
      <rect x="2" y="18" width="12" height="12" rx="3.5" fill="currentColor" />
      <rect x="18" y="18" width="12" height="12" rx="3.5" className="fill-primary" />
    </svg>
  );
}
```

Taille d'usage : 24 px dans la sidebar, 20 px dans la topbar. En dessous de 24 px,
utiliser le favicon (géométrie simplifiée), pas le logo.

## 5. Vérification

```bash
npm run typecheck --workspace @martylab/portal
npm run lint --workspace @martylab/portal
npm run build --workspace @martylab/portal
```

Effectué le 11 novembre 2026 : typecheck et build sans erreur, lint sans nouveau
avertissement. Dans le build de production, `dist/manifest.webmanifest` déclare
`theme_color` et `background_color` à `#0C1116`, les quatre icônes sont servies en
200 avec les octets des fichiers livrés (488 o, 2 374 o, 7 314 o, 14 095 o, 2 377 o
pour l'icône Apple), et le symbole du portail correspond au fichier officiel.

Reste à contrôler sur appareil réel : rendu du favicon à 16 px, icône sur l'écran
d'accueil Android (maskable) et iOS, absence de régression de contraste sur la
sidebar claire et sombre.

## 6. Impression du guide (si régénération)

```powershell
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$src = (Resolve-Path "docs/brand/src/generated/guide.html").Path.Replace('\','/')
& $chrome --headless=new --disable-gpu --no-first-run --no-pdf-header-footer `
  --print-to-pdf="$PWD/docs/brand/martylab-brand-guide.pdf" "file:///$src"
```

Le CSS fixe `@page { size: A4; margin: 0 }`. Contrôler que le contenu remplit la
page (aucune marge blanche à droite) : c'est le signe qu'aucun élément ne dépasse
la largeur.
