# Manifeste — kit de marque Martylab v1.0.0

Généré le 11 novembre 2026 à 11:41
par `src/make-manifest.mjs`, à partir des fichiers présents sur disque.

- Version : 1.0.0
- Accent clair : #3D7A24 (`oklch(52.0% 0.135 138)`)
- Accent sombre : #7EB66B (`oklch(72.0% 0.12 138)`)
- Logotype : Bricolage Grotesque 600, interlettrage −0,02 em, vectorisé

### Logos vectoriels

| Fichier | Dimensions | Octets | SHA-256 |
| --- | --- | --- | --- |
| `martylab-logo-horizontal-dark.svg` | vectoriel | 5204 | `d4d902cb325429daa181151bde97aaeb8a992db0fa66b2e839ff2e7447f1d35c` |
| `martylab-logo-horizontal-mono-black.svg` | vectoriel | 5212 | `3c058402eb2b542227cdc224790115f93b1679c31ebe81871acc50100dde7adf` |
| `martylab-logo-horizontal-mono-white.svg` | vectoriel | 5214 | `f67f737167a5ac6a96a2d4c65ebfb028ed994261305493d41aadee7db62f1c44` |
| `martylab-logo-horizontal.svg` | vectoriel | 5202 | `599caeb80037444b89f152f0320b9e2e4b15a8dec71527976c28858c862bc134` |
| `martylab-logo-stacked-dark.svg` | vectoriel | 5624 | `5e44e1fdb88f361d424c78ff84fddb67c302758091ae9b308cbc15496929b017` |
| `martylab-logo-stacked.svg` | vectoriel | 5622 | `5e34440a745ba12c118c89e07121e500037b4b143416a4a7e298a8e051b2218e` |
| `martylab-symbol-dark.svg` | vectoriel | 521 | `fee947f8d6b2eb5b3a8b172b5739aa3884bdb8ca7f94f24be524f410b2107a9a` |
| `martylab-symbol-mono-black.svg` | vectoriel | 511 | `c131dfe61b7e0f29ae2b81ba1579b7e683e279af56eb7c59724518a2c0a09cc5` |
| `martylab-symbol-mono-white.svg` | vectoriel | 513 | `a2c802d3c7f301c6d1aa489710e7fa48084c29697264bc25e0cf7210d94fff2d` |
| `martylab-symbol.svg` | vectoriel | 519 | `011890cb25fc49be99cebf7ead871bfe648453db8a7592679c71b2bcaeda9e0a` |

### Icônes

| Fichier | Dimensions | Octets | SHA-256 |
| --- | --- | --- | --- |
| `martylab-app-icon-1024.png` | 1024 × 1024 | 16425 | `86ce541e6c4d5f739a243faa73e1c772280a6d5ec501d3f635fe5d1cbf10c326` |
| `martylab-app-icon-foreground-1024.png` | 1024 × 1024 | 14117 | `d4c35b8c49ed745f2064300477a1024ae7cf7a4ea61eb3fdf00ef6b94dc350e6` |
| `martylab-app-icon-foreground.svg` | vectoriel | 573 | `3e286c3005bf74dc7dd3f77ef6c062a9e93573a207dfa34f2fcd376b377c454b` |
| `martylab-app-icon-maskable-1024.png` | 1024 × 1024 | 14095 | `0991f0d163c7840e4f05389df755c1dce923ba0ca4cd58ca08f463012a2001ef` |
| `martylab-app-icon-maskable.svg` | vectoriel | 648 | `4d3c4f12d96e044f9f7d24170cdeacc6d144daa62b19dd270005b09687f5995e` |
| `martylab-app-icon.svg` | vectoriel | 648 | `08b7d494a1f82e862ecedfebd1850e4e7a7d654287a0e1a675a383f383189e3e` |
| `martylab-apple-touch-icon-180.png` | 180 × 180 | 2377 | `323c12f0cb489cd299fe088c216fe3f694a6eece3eb637f8c888ce1bb982bc13` |
| `martylab-favicon-32.png` | 32 × 32 | 560 | `22120bf4c9ce57a1d0a168dac87f5bcf9a2a078864d2fdf94e32c646b5be1c6c` |
| `martylab-favicon.svg` | 32 × 32 | 488 | `419d654aaf5028077c229b19c26b4d9857b4b44e52c344e5ae89acd6539b67bc` |
| `martylab-notification-badge-96.png` | 96 × 96 | 1287 | `f2ab1698baba1692873887fe541c3ffdd5d95bfdcdefac9ea6a1668f30311a66` |
| `martylab-notification-badge.svg` | vectoriel | 539 | `345c5677ed620287d4b07fb1e6005a0c33ac2b1a0845013f9ea3e1a6cdc167ee` |
| `martylab-pwa-192.png` | 192 × 192 | 2374 | `2fd44e4db53f5ed7090bed9172ea9eadaab9b448fbd6f50a54ee0b1b6beb11bf` |
| `martylab-pwa-512.png` | 512 × 512 | 7314 | `1bb27c57a4ec333d4a850e791a75908751688b9bd22e408916e8a4efde92b0c1` |

### Documents

| Fichier | Dimensions | Octets | SHA-256 |
| --- | --- | --- | --- |
| `martylab-brand-guide.pdf` | A4 · 10 pages | 1048606 | `f2c595742157fccd8b15e22a4e13812f057d917565ea8a29145f7985f94658b6` |
| `martylab-brand-sheet.pdf` | A4 · 10 pages | 113949 | `469cf1d14bf421ab6cc0c2c583a898e7403a4fd0e425b50da9398e51fe886152` |

## Vérification

```bash
python docs/brand/src/verify.py
```

Le script recalcule les hachages, lit les dimensions réelles des PNG, ouvre le PDF,
compare les couleurs des SVG aux jetons et vérifie que le guide cite tous les fichiers.
