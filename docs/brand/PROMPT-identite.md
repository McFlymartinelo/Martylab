# Prompt — Identité visuelle Martylab (kit de marque livrable)

> À coller tel quel dans un agent capable de **créer des fichiers** (design/asset
> agent, Claude avec accès fichiers, etc.). Le prompt suppose que l'agent
> travaille dans le dépôt Martylab.

---

## Rôle

Tu es directeur artistique et designer produit senior. Tu produis une identité
de marque **industrielle** : des fichiers sources propres, versionnés et
utilisables directement dans une application React/PWA — pas des visuels de
présentation.

Tu travailles pour **Martylab**, plateforme personnelle auto-hébergée.

## Contexte produit (ne rien inventer)

Martylab est un hub unifié qui orchestre des applications **indépendantes**
(Orion, Matchday, Jellyfin, Immich, Portainer, NAS UGREEN, Cloudflare Tunnel)
via des plugins et connecteurs, avec un Assistant à outils contrôlés.

- Production : `https://martylab.martylab.fr`
- Usage : privé, dense, technique. Desktop + mobile (PWA installable).
- Ce n'est ni un dashboard SaaS générique, ni une app grand public, ni un
  produit à slogan.

L'identité existe déjà partiellement en production — direction « Cockpit » :

| Élément | Source de vérité |
| --- | --- |
| Jetons couleur (OKLCH, clair + sombre) | `apps/portal/src/index.css` |
| Symbole actuel (4 modules, 1 actif) | `apps/portal/src/components/layout/brand-mark.tsx` |
| Typographies auto-hébergées | `apps/portal/src/index.css` (`@fontsource-variable`) |
| Icône PWA / favicon | `apps/portal/public/favicon.svg` (**encore l'icône générique violette : à remplacer**) |
| Manifest | `theme_color: #6fc46f`, `background_color: #0b0c0e` |
| Guide de la refonte | `docs/redesign/README.md` |

**Mission : formaliser cette direction en identité complète et livrable.** Tu
peux affiner le symbole (proportions, corrections optiques, respiration,
variantes) ; le principe « modules indépendants + un point d'orchestration »
reste. Toute divergence doit être justifiée par écrit.

## Contraintes non négociables

1. **Nom** : toujours `Martylab` (M majuscule, reste en minuscules). Jamais
   `MartyLab`, `Marty Lab`, `MARTYLAB`. **Aucun slogan, baseline, tagline ou
   descripteur** accolé au nom (« self-hosted », « hub », « orchestration »…).
2. **Un seul accent** : le vert signal des jetons. Pas de seconde couleur de
   marque, pas de dégradé, pas de glow, pas d'ombre portée, pas de 3D, pas de
   texture. Le langage Cockpit = aplats, lignes de 1 px, géométrie.
3. **Lisible à 16 px**, en monochrome, sur fond clair et sur fond sombre. Le
   symbole doit fonctionner seul ; le nom doit fonctionner sans le symbole.
4. **Polices** : uniquement les trois familles déjà embarquées, toutes libres
   (SIL OFL) : Bricolage Grotesque, Inter Tight, JetBrains Mono. Aucune police
   supplémentaire, aucune police payante.
5. **Couleurs** : dérivées des jetons OKLCH existants. Toute teinte nouvelle
   doit être justifiée et documentée. **Aucune valeur approximative** : les HEX,
   RGB et ratios de contraste sont calculés, pas estimés.
6. **Aucune donnée fictive** présentée comme réelle : les écrans d'application
   du guide sont des démonstrations, clairement identifiées comme telles.

## Livrables

### 1. Fichiers de logo — un fichier par déclinaison

Chaque variante est un fichier **indépendant et téléchargeable**, jamais une
découpe d'une image unique.

| Fichier | Contenu |
| --- | --- |
| `martylab-logo-horizontal.svg` | symbole + nom, pour fond clair |
| `martylab-logo-horizontal-dark.svg` | idem, pour fond sombre |
| `martylab-logo-stacked.svg` | version compacte / empilée, fond clair |
| `martylab-logo-stacked-dark.svg` | idem, fond sombre |
| `martylab-symbol.svg` | symbole couleur, fond transparent |
| `martylab-symbol-mono-black.svg` | symbole 100 % noir |
| `martylab-symbol-mono-white.svg` | symbole 100 % blanc |
| `martylab-logo-horizontal-mono-black.svg` | logo complet noir |
| `martylab-logo-horizontal-mono-white.svg` | logo complet blanc |

Exigences SVG : `viewBox` présent, aucune image raster embarquée, aucun filtre,
aucune police externe (texte **vectorisé**), `fill` en couleurs explicites pour
les versions couleur et `currentColor` **uniquement** si c'est documenté.
Coordonnées sur une grille cohérente (multiple de 0,5), pas de `transform`
résiduel ni de métadonnées d'éditeur.

### 2. Icônes — PNG transparent + SVG

| Fichier | Spécification |
| --- | --- |
| `martylab-app-icon-1024.png` | carré 1024 × 1024, **opaque, coins pleins, sans arrondi prémâtré** (iOS applique son masque) ; symbole dans une zone sûre de 80 % |
| `martylab-app-icon-maskable-1024.png` | 1024 × 1024, contenu clé dans le cercle central de 80 % (spec maskable Android) |
| `martylab-app-icon-foreground-1024.png` | calque avant transparent pour icône adaptative Android |
| `martylab-apple-touch-icon-180.png` | 180 × 180, opaque |
| `martylab-pwa-192.png` / `martylab-pwa-512.png` | 192 et 512 px, `purpose: any` |
| `martylab-favicon.svg` | symbole simplifié, lisible à 16 px, sans détail fin |
| `martylab-favicon-32.png` | 32 × 32, contrôle optique du rendu réel |

Le favicon est une **réduction optique**, pas un redimensionnement : simplifier
ou supprimer ce qui disparaît à 16 px (opacités, 1 px de trait, espacements).

### 3. Guide de marque PDF

`martylab-brand-guide.pdf` — clair, concis, illustré, autonome. Sections
obligatoires :

1. **Concept et intention** : ce que le symbole représente, en 3 phrases max,
   sans storytelling marketing.
2. **Versions du logo** et cas d'usage (web, app, favicon, monochrome).
3. **Couleurs** : valeurs exactes **OKLCH, HEX, RGB** et, si fourni, **CMJN**
   avec le profil ICC utilisé (ex. ISO Coated v2) — sinon écrire explicitement
   « CMJN non fourni, conversion dépendante du profil ».
4. **Typographies** : noms exacts, fonderie, licence, plages de graisses,
   graisses retenues par usage (display, UI, chiffres), interlettrage.
   Références précises et liens vers les sources libres.
5. **Règles** : taille minimale par variante (en px numériques et en mm
   impression), zone de protection définie en unité du symbole **et** en px,
   placement, alignements.
6. **Fonds autorisés** et **tableau de contrastes calculés** (voir plus bas).
7. **Usages à éviter**, avec exemples visuels fautifs et la correction.
8. **Applications** : icône mobile, tableau de bord web (clair + sombre), écran
   de téléphone. Réutiliser les vraies surfaces Cockpit, pas des maquettes
   génériques.
9. **Manifeste des fichiers** : nom, format, dimensions, poids, usage.

Le guide **embarque les fichiers réellement livrés** (mêmes géométries, mêmes
couleurs). Il ne redessine rien à la main.

### 4. Planche d'aperçu

`martylab-brand-sheet.pdf` (ou `.png`) : uniquement un **plus**, jamais un
substitut aux fichiers.

### 5. Archive

`docs/brand/dist/martylab-brand-kit-v1.0.0.zip` contenant l'arborescence
complète + `MANIFEST.md` (nom, dimensions, SHA-256 de chaque fichier).

## Arborescence imposée

```text
docs/brand/
  README.md                  # index, liens, versions
  martylab-brand-guide.pdf
  martylab-brand-sheet.pdf
  assets/logo/               # 9 SVG ci-dessus
  assets/icons/              # PNG + favicon
  src/                       # sources éditables (Figma/SVG de travail, scripts)
  dist/martylab-brand-kit-v1.0.0.zip
  MANIFEST.md
```

## Spécifications à fixer (pas à laisser ouvertes)

- **Palette** : reprendre les jetons existants — accent clair
  `oklch(52% 0.135 138)`, accent sombre `oklch(72% 0.12 138)`, fonds
  `oklch(97.3% 0.006 235)` / `oklch(17.5% 0.014 250)`, sidebar sombre
  `oklch(12% 0.012 250)`, texte `oklch(20.5% 0.018 245)` / `oklch(96% 0.004 250)`.
  Calculer les équivalents sRGB et **résoudre l'incohérence actuelle** entre
  `theme_color: #6fc46f` du manifest et `--primary` : une seule valeur fait
  foi ensuite.
- **Contrastes à documenter et vérifier** (WCAG 2.2) : texte normal ≥ 4,5:1,
  grand texte et éléments non textuels ≥ 3:1. Paires minimales : accent sur
  fond clair, accent sur fond sombre, texte sur fond, texte secondaire sur
  fond, symbole sur fond clair/sombre. Les ratios sont **calculés par script**
  (ex. `colorjs.io`), pas estimés.
- **Taille minimale** : symbole 16 px (favicon) / 24 px (UI), logo horizontal
  96 px de large, logo empilé 64 px de large — valider visuellement, corriger
  si illisible.
- **Zone de protection** : exprimée en fraction du côté du symbole, constante
  sur toutes les variantes.
- **Typographie** : display = Bricolage Grotesque (variable 200–800, interlettrage
  négatif déjà en prod : `-0.02em` sur les titres) ; UI = Inter Tight (variable
  100–900) ; chiffres/codes = JetBrains Mono (variable 100–800, chiffres
  tabulaires). Documenter la graisse du logotype et son interlettrage exact.
- **Icône 1024** : fond `oklch(17.5% 0.014 250)` (ou le graphite retenu),
  symbole accentué, zone sûre respectée, contrôle du rendu à 60 px et 29 px.

## Vérification avant de conclure (obligatoire)

Tu dois **prouver** que les livrables sont réels, pas les décrire :

1. Chaque SVG s'ouvre et se parse (aucune erreur XML), `viewBox` cohérent.
2. Chaque PNG a **exactement** les dimensions annoncées et le bon mode alpha
   (lu par outil, pas supposé).
3. Le PDF s'ouvre, son nombre de pages est annoncé, les polices sont
   embarquées ou vectorisées.
4. Les ratios de contraste sont produits par calcul et reproduits dans le
   guide, identiques aux valeurs livrées.
5. Le ZIP est listé (`unzip -l` ou équivalent) et chaque entrée du manifeste
   existe ; aucune entrée fantôme, aucun fichier oublié.
6. Le guide référence **les noms de fichiers réellement présents**.
7. Les liens/chemins de téléchargement sont testés un par un.
8. Si l'environnement ne permet pas d'écrire des fichiers ou de créer un ZIP :
   le dire explicitement et livrer le meilleur format réellement disponible.
   **Ne jamais présenter un aperçu ou une capture comme un fichier exporté.**

## Intégration applicative (lot séparé, sur validation)

Ne modifie pas l'application dans le même lot. Propose un diff séparé, prêt à
appliquer :

- `apps/portal/public/` : favicon + icônes PWA (192/512/maskable/apple-touch) ;
- `apps/portal/public/manifest.webmanifest` : `icons`, `theme_color`,
  `background_color` alignés sur le kit ;
- `apps/portal/index.html` : `apple-touch-icon`, `theme-color` ;
- `brand-mark.tsx` : remplacement par le symbole officiel **sans régression**
  d'accessibilité (`aria-hidden`, `currentColor`, taille 24 px) ;
- vérification : `npm run typecheck && npm run lint && npm run build`.

Toute évolution des jetons de couleur en production exige une entrée dans
`DECISIONS.md` (ADR) — pas une modification silencieuse de `index.css`.

## Ce que tu ne dois pas faire

- Inventer un slogan, une baseline, une mascotte, un « univers ».
- Ajouter un dégradé, un glow, une ombre, un effet de profondeur.
- Introduire une police ou une couleur hors du système existant.
- Livrer une seule image contenant toutes les variantes.
- Livrer un logo texte non vectorisé ou dépendant d'une police installée.
- Annoncer des valeurs (HEX, ratios, dimensions) non mesurées.
- Modifier `apps/portal` ou `index.css` sans lot d'intégration validé.
- Committer des secrets, des captures de production ou des données réelles.

## Definition of Done

- [ ] 9 SVG de logo + 8 fichiers d'icônes, chacun indépendant et nommé.
- [ ] Icône 1024 opaque, coins pleins, zone sûre vérifiée ; version maskable.
- [ ] Guide PDF complet, valeurs exactes, contrastes calculés, exemples d'usage
      et contre-exemples.
- [ ] Manifeste + SHA-256 + ZIP vérifié, arborescence conforme.
- [ ] Aucun lien mort, aucun aperçu présenté comme fichier.
- [ ] Rapport final court : fichiers produits, décisions prises, écarts,
      commandes de vérification et leurs sorties.
