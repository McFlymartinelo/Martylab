# Identité visuelle Martylab

Kit de marque versionné, aligné sur le design system **Cockpit** déjà en production
dans le portail. Tout ce qui est décrit ici existe réellement dans ce dossier : les
fichiers sont les sources, pas des aperçus.

| Livrable | Fichier |
| --- | --- |
| Guide de marque (10 pages, A4) | [`martylab-brand-guide.pdf`](./martylab-brand-guide.pdf) |
| Planche d'aperçu (1 page) | [`martylab-brand-sheet.pdf`](./martylab-brand-sheet.pdf) |
| Logos vectoriels | [`assets/logo/`](./assets/logo) |
| Icônes et favicon | [`assets/icons/`](./assets/icons) |
| Manifeste SHA-256 | [`MANIFEST.md`](./MANIFEST.md) |
| Intégration portail | [`INTEGRATION.md`](./INTEGRATION.md) |
| Archive complète | `dist/martylab-brand-kit-v1.0.0.zip` (générée par `src/make-zip.ps1`, non versionnée) |
| Prompt de génération | [`PROMPT-identite.md`](./PROMPT-identite.md) |

## Le symbole

Quatre modules identiques sur une grille 32 × 32 (module 12, gouttière 4, rayon 3,5,
marge 2). Trois modules neutres, un module actif en vert signal : le point
d'orchestration. Le symbole reprend exactement la marque déjà utilisée dans
`apps/portal/src/components/layout/brand-mark.tsx`.

## Couleurs

Dérivées des jetons OKLCH de `apps/portal/src/index.css`, converties en sRGB par
`src/color.mjs` :

| Rôle | Clair | Sombre |
| --- | --- | --- |
| Fond | `#F2F7FA` | `#0C1116` |
| Texte | `#10181F` | `#F0F2F4` |
| Accent signal | `#3D7A24` | `#7EB66B` |
| Trait | `#D8DDE1` | `#293037` |

Aucune valeur CMJN n'est publiée : la conversion dépend d'un profil ICC fourni par
l'imprimeur. Voir le guide, section 03.

## Typographies

| Rôle | Famille | Licence | Source |
| --- | --- | --- | --- |
| Display, logotype | Bricolage Grotesque 600 | SIL OFL 1.1 | `@fontsource-variable/bricolage-grotesque` |
| Interface | Inter Tight 400/500 | SIL OFL 1.1 | `@fontsource-variable/inter-tight` |
| Chiffres, codes | JetBrains Mono 400/500 | SIL OFL 1.1 | `@fontsource-variable/jetbrains-mono` |

Le logotype est vectorisé dans les SVG : aucune police n'est nécessaire pour les
afficher ou les imprimer.

## Regénérer le kit

```bash
python docs/brand/src/wordmark.py      # tracés du logotype (Bricolage 600)
node docs/brand/src/color.mjs          # OKLCH → sRGB + contrastes
node docs/brand/src/build-assets.mjs   # SVG + PNG (resvg)
node docs/brand/src/build-guide.mjs    # guide.html + sheet.html
# impression PDF via Chrome headless (voir la commande dans INTEGRATION.md)
node docs/brand/src/make-manifest.mjs  # MANIFEST.md + SHA-256
powershell -File docs/brand/src/make-zip.ps1
python docs/brand/src/verify.py        # contrôles réels
```

## Choix documentés

- **Graphie** : `Martylab` (M majuscule, un seul mot). Aucune baseline, aucun slogan.
- **Monochrome** : une encre, deux valeurs (100 % et 45 %). La hiérarchie module
  actif / inactif est conservée pour rester reconnaissable en une seule encre.
- **Favicon** : plaque graphite + modules simplifiés (rayon 2,5), pour rester lisible
  sur les barres d'onglets claires et sombres.
- **Icône mobile** : fond plein, coins non arrondis (iOS applique son masque), symbole
  dans la zone sûre ; une variante `maskable` et un calque avant Android sont fournis.
- **Pas de JPG** : le format ne gère pas la transparence et dégrade les aplats.

## Portée

Le kit est appliqué au portail : `apps/portal/public/favicon.svg`, `apps/portal/public/icons/`,
`index.html`, `vite.config.ts` et `brand-mark.tsx` utilisent les fichiers décrits ici.
Le détail des changements et les points à contrôler sur appareil réel sont dans
[`INTEGRATION.md`](./INTEGRATION.md).
