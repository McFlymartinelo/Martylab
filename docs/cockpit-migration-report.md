# Migration « Cockpit » — rapport final

> Passage du prototype `docs/redesign/` à l'application réelle.
> Lots 1, 2, 3 et 5 livrés ; lot 4 (Console) explicitement reporté.
> Les écarts détaillés figurent aussi dans `docs/redesign/README.md`.

---

## 1. Périmètre livré

| Lot | Contenu | État |
| --- | --- | --- |
| 1 — Fondations design | Jetons Aura → variables shadcn, accent vert signal, 3 polices auto-hébergées, rayons, couleurs PWA | ✅ |
| 2 — Shell et navigation | Groupes de nav, sidebar groupée, palette `Ctrl/⌘+K`, topbar, tab bar mobile + bottom sheet | ✅ |
| 3 — Pages | Tableau de bord, Système (6 onglets), Services, Applications, Univers, Configuration | ✅ |
| 4 — Console | Allowlist typée + audit | ⏸️ reporté (non validé), aucune entrée de nav |
| 5 — Finitions | Toasts, `prefers-reduced-motion`, focus, squelettes, PWA, docs, rapport | ✅ |

---

## 2. Commits

```text
feat(design): adopt cockpit tokens, fonts and signal accent
feat(portal): group cockpit navigation and sidebar
feat(portal): add keyboard command palette
feat(portal): add mobile tab bar and more sheet
fix(dev): proxy the portal API to IPv4 loopback
fix(auth): scope brute-force limit to login
fix(portal): keep link buttons semantic
feat(portal): rebuild dashboard as cockpit overview
feat(system): add read-only host collectors
feat(portal): rebuild system page with telemetry tabs
feat(portal): rebuild services page
feat(portal): align pages with cockpit headers
feat(portal): add light toasts and motion preferences
refactor(portal): remove superseded system widgets
docs(redesign): document cockpit decisions and gaps
fix(system): confine mount reads to host root
chore(portal): polish loading copy and focus rings
fix(system): stop exposing process command lines
feat(portal): score server load without uptime bias
docs(redesign): add before/after cockpit captures
```

---

## 3. Fichiers principaux

### Créés — portail

- `components/cockpit/` : `page-header`, `panel`, `data-table` (table desktop + cartes
  mobile), `key-value-list`, `metric-line`, `feedback` (`InlineEmpty`, `Unavailable`).
- `components/layout/` : `brand-mark`, `user-menu`.
- `components/system/tabs/` : overview, network, storage, processes, hardware, journal.
- `components/dashboard/` : `health-hero`, `today-panel`.
- `components/ui/dialog`, `components/ui/toast`, `lib/use-toast`, `lib/platform-status`,
  `lib/docker-state`.
- `docs/screenshots/redesign/` : 24 captures avant/après.

### Créés — backend / contrats

- `packages/shared/src/system.ts` : overview, storage, hardware, RAID, capteurs.
- `apps/backend/src/connectors/server/server-system-info.ts` + tests de parseurs.
- `apps/backend/src/middleware/rate-limit.test.ts`.

### Modifiés

- `apps/portal/src/index.css` : tokens Cockpit, polices, reduced-motion.
- `lib/nav-items.ts` : `group`, ordre prototype, ordre mobile.
- `sidebar.tsx`, `topbar.tsx`, `mobile-nav.tsx`, `quick-search.tsx`.
- `pages/dashboard-page.tsx`, `system-page.tsx`, `services-page.tsx`, `apps-page.tsx`,
  pages Univers/Configuration (en-têtes partagés).
- `routes/system.ts`, `server-host-stats.ts`, `server-metrics.ts`, `app.ts`.
- `DECISIONS.md` (ADR-019, ADR-020), `docs/redesign/README.md` (écarts).

### Supprimés (remplacés)

`system-panel`, `system-instrumentation-panel`, `docker-container-groups`,
`capacity-bar`, `gauge-dial`, `health-bar`, `metric-card`, `radial-gauge`.
`recharts` reste utilisé par `Sparkline`.

---

## 4. Décisions et alternatives écartées

| Décision | Alternative écartée | Raison |
| --- | --- | --- |
| Remapper Aura sur les variables shadcn | Ajouter `aura.css` en parallèle | Évite deux systèmes de tokens divergents |
| Vert signal par défaut | Conserver le violet | Conforme au prototype validé |
| Polices locales, sous-ensemble latin | Google Fonts CDN | Souveraineté + cache PWA maîtrisé |
| Palette de commandes ⌘K | Champ de recherche inline | Navigation clavier et filtrage par rôle |
| Bottom sheet mobile | Menu déroulant | Cibles ≥ 44 px, zones sûres iOS |
| Collecteurs `/proc` `/sys` lecture seule | `systeminformation` ou commandes shell | Pas de shell, moins de dépendances |
| « Non disponible » explicite | Valeurs simulées | Règle absolue du projet |
| Console reportée | Livrer une allowlist partielle | Surface de sécurité à revoir séparément |
| Limiter le brute-force au login | Limiter tout `/api/auth` | 10 chargements de page bloquaient `/me` (429) |

Le score « santé » mesure désormais la **charge** (CPU/RAM/disque) et non l'uptime :
un serveur fraîchement démarré n'est plus affiché « dégradé » alors que ses ressources
sont saines.

---

## 5. Sécurité et rôles

- Autorisations toujours vérifiées côté backend : `requireAuth` sur tous les
  endpoints système, `requireMinRole("user")` pour les actions Docker, `admin`
  pour les utilisateurs.
- Test invité exécuté sur l'application réelle :
  - entrée « Utilisateurs » absente de la navigation ;
  - `GET /api/users` → **403** ;
  - `/users` bloqué par `RequireAdmin` ;
  - boutons Docker désactivés + bandeau « lecture seule ».
- Rate limit : 10 tentatives/15 min sur `POST /api/auth/login` uniquement, clé IPv6
  normalisée (`ipKeyGenerator`) ; `/me` et `/logout` ne sont plus limités.
- Télémétrie : aucune commande externe ; lignes de commande des processus **non
  exposées** (les argv peuvent contenir des secrets) ; `statfs` confiné à
  `HOST_ROOT_PATH`.
- Aucune valeur inventée : les blocs sans source affichent leur raison.

---

## 6. Accessibilité

- Palette : `role="combobox"` + `listbox`, `aria-activedescendant`, ↑/↓, Home/End,
  Entrée, Échap ; ouverture `Ctrl/⌘+K`.
- Dialogues Base UI : focus piégé, fermeture Échap et bouton dédié.
- Anneaux `focus-visible` cohérents sur sidebar, tab bar, feuilles mobiles.
- `aria-current` fourni par `NavLink` ; cibles mobiles ≥ 44 px.
- `prefers-reduced-motion` : animations et transitions neutralisées.
- Contrastes des couples texte/fond vérifiés AA (voir tableau ci-dessous).

```text
LIGHT  foreground/bg 16.57 · muted/card 8.32 · primary/bg 4.84 · on-primary 5.09
       badges : success 4.77 · warn 16.26 · danger 5.50 · info 4.69
DARK   foreground/bg 16.88 · muted/card 9.06 · primary/bg 7.96 · on-primary 8.13
       badges : success 7.48 · warn 8.53 · danger 5.51 · info 7.13 (texte sur carte)
```

---

## 7. Écarts prototype ↔ production

Voir le tableau complet dans `docs/redesign/README.md`. Résumé :

- **Données absentes** : historique d'incidents, latence par application, uptime
  par conteneur, stacks Compose (labels non collectés).
- **Volontairement non disponibles** : SMART, journald/unités systemd, ports en
  écoute, mises à jour, sauvegardes, DMI/BIOS, consommation électrique.
- **Reporté** : console (allowlist + audit) et son entrée de navigation.
- **Adapté** : barre de commande du dashboard → carte vers `/assistant` ; panneau
  « Aujourd'hui » limité aux connecteurs qui répondent.
- **Conservé** : « Automatisations » et « Journal d'activité ».
- **Dashboard** : l'Assistant embarqué a été remplacé par une carte ; la page
  `/assistant` reste la source complète (moins de JS sur le dashboard).

---

## 8. Risques restants

1. **Collecteurs système** : dépendants de `/proc` et `/sys` ; en production les
   montages d'ADR-016 sont requis, sinon le backend décrit le conteneur.
2. **Console** : non livrée ; si elle est reprise, l'allowlist, l'audit et les
   tests de rôle sont indispensables avant toute exposition.
3. **Groupement Docker** : heuristique sur le nom, à remplacer par les labels
   Compose si le connecteur les expose un jour.
4. **PWA** : `cleanupOutdatedCaches` + `autoUpdate` évitent l'ancien design, mais
   un onglet ouvert avant déploiement peut nécessiter un rechargement.
5. **Performance** : chunk React ~428 kB (139 kB gzip) incluant Base UI ;
   à surveiller si de nouveaux composants Base UI entrent dans le bundle initial.

---

## 9. Validation

```text
npm run typecheck          ✅ backend + portal + shared
npm run lint               ✅ oxlint (5 warnings préexistants « only-export-components »)
npm run build              ✅ shared + portal (PWA, 20 entrées précachées) + backend
npm run test -w @martylab/backend
                           ✅ 5 fichiers, 29 tests
```

Tests ajoutés : limiteur de login (blocage au 11ᵉ essai, `/me` non limité),
parseurs système (`loadavg`, `swap`, `diskstats`, `mdstat`, `mounts`,
`os-release`, `btime`, débits disque).

Captures : `docs/screenshots/redesign/` — `before-*` et `after-*` pour Tableau de
bord, Système et Services, en 1440×1000 et 390×844, thèmes sombre et clair.
Les captures « after » ont été prises sur le rendu réel avec le backend Linux
conteneurisé (données réelles). Les captures « before » proviennent du commit
`985d708` (avant refonte) ; la police Geist n'étant plus installée dans le
monorepo, elles utilisent la police de repli.
