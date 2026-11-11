# Prompt — Migration du redesign « Cockpit » dans Martylab

> À coller tel quel dans un agent de code (Claude Code, Cursor, Codex…).
> Le prompt suppose que l’agent travaille dans le dépôt Martylab.

---

## Rôle

Tu es l’architecte logiciel et développeur lead de **Martylab**. Tu travailles
comme un senior : sécurité d’abord, puis fiabilité, maintenabilité, simplicité,
performance.

Tu dois d’abord lire, dans cet ordre :

1. `AGENTS.md` (règles du projet, non négociables)
2. `ARCHITECTURE.md`, `DECISIONS.md`, `ROADMAP.md`
3. `docs/redesign/README.md` (le prototype et son intention)
4. `apps/portal/src/index.css`, `apps/portal/src/App.tsx`,
   `apps/portal/src/lib/nav-items.ts`
5. `apps/portal/src/pages/system-page.tsx`, `services-page.tsx`,
   `components/layout/*`, `components/system/*`
6. `packages/shared/src/index.ts` (contrats)
7. `apps/backend/src/routes/*` et `apps/backend/src/connectors/*`

## Contexte

Le dossier `docs/redesign/` contient un **prototype visuel cliquable** de la
refonte « Cockpit » : toutes les pages, desktop et mobile, thème sombre et
clair, avec des **données fictives**.

Ce prototype est la **référence visuelle et UX**. Ce n’est **pas** du code à
recopier : c’est du HTML/CSS/JS statique. La cible est l’application réelle :

- `apps/portal` — React 19, TypeScript strict, Vite, Tailwind CSS v4,
  shadcn/Base UI, TanStack Query, React Router 7, lucide-react.
- `apps/backend` — Node, Express 5, Drizzle, PostgreSQL, connecteurs
  (Docker, Portainer, Cloudflare, NAS, Orion, Jellyfin, Immich, Matchday).
- `packages/shared` — contrats partagés front/back.

## Objectif

Porter la refonte « Cockpit » dans l’application réelle, **sans régression
fonctionnelle**, en lots livrables et commités séparément.

À la fin :

- le portail ressemble au prototype (tokens, shell, pages, responsive) ;
- toutes les données affichées viennent de l’API réelle ;
- les rôles et permissions sont appliqués côté serveur ;
- `typecheck`, `lint`, `build` et les tests backend passent ;
- l’application reste utilisable après chaque lot.

---

## Règles absolues

1. **Aucune donnée fictive en production.** Si une donnée du prototype n’a pas
   d’équivalent API, affiche « non disponible », masque le bloc, ou n’implémente
   pas l’onglet. Ne simule jamais une valeur.
2. **Sécurité serveur.** Ne jamais faire confiance au front pour les rôles,
   les permissions ou les actions sensibles.
3. **Pas de shell libre, pas de `sudo`, pas d’exécution arbitraire.** La console
   n’est pas un terminal système (voir lot 4).
4. **Ne supprime aucune fonctionnalité existante.** Le prototype ne montre pas
   « Automatisations » ni « Journal d’activité » : ces entrées doivent rester
   dans le portail réel.
5. **Pas de réécriture massive.** Migration incrémentale, l’application doit
   fonctionner à chaque commit.
6. **Pas de nouvelle dépendance sans justification écrite** (poids, licence,
   maintenance). Les polices doivent être auto-hébergées, pas chargées depuis
   Google Fonts.
7. **Ne modifie pas `docs/redesign/`** : c’est la référence, pas la cible.
8. **Accessibilité** : navigation clavier, focus visible, `aria-*`, contraste
   AA, `prefers-reduced-motion`.
9. **Commits conventionnels**, petits, par lot (`feat(portal): …`,
   `feat(design): …`, `feat(console): …`).
10. Si une décision est ambiguë (accent par défaut, périmètre de la console,
    onglets non alimentés), **pose la question avant d’implémenter**.

---

## Étape 0 — Inventaire et plan (à produire avant de coder)

Produis un plan court qui contient :

- la correspondance prototype → fichiers existants ;
- la liste des écarts de données (ce que l’API ne fournit pas) ;
- les composants à extraire ou étendre ;
- les risques de régression (auth, rôles, PWA, thème) ;
- l’ordre des lots et ce qui est inclus/exclu.

Ne commence le lot 1 qu’après validation de ce plan.

---

## Lot 1 — Fondations design

**But :** installer l’identité Cockpit dans le design system existant, sans
casser les composants shadcn déjà utilisés.

- Convertir les jetons du prototype (`docs/redesign/aura.css`) en variables
  Tailwind v4 dans `apps/portal/src/index.css` : couleurs, surfaces, lignes,
  rayons, ombres, typographie.
- Trois familles : **Bricolage Grotesque** (display), **Inter Tight** (UI),
  **JetBrains Mono** (chiffres, codes, terminal). Auto-hébergées via
  `@fontsource-variable` (ou fichiers locaux), avec `font-display: swap`.
- L’accent par défaut devient le **vert signal** du prototype. Le violet actuel
  n’est plus la couleur primaire. Le thème clair/sombre existant
  (`theme-provider`) est conservé.
- Vérifier les contrastes AA sur les couples texte/fond, notamment les badges
  `success`, `warn`, `danger` et les textes secondaires.
- Ne pas dupliquer un second système de CSS : les composants continuent
  d’utiliser les classes Tailwind et les primitives shadcn.

**Accepté si :** le portail s’affiche avec les nouveaux jetons en clair et
sombre, sans composant cassé, `npm run build` passe.

---

## Lot 2 — Shell et navigation

**But :** reproduire le cadre applicatif du prototype.

- `lib/nav-items.ts` : ajouter un champ `group` et l’ordre du prototype :
  - **Pilotage** : Tableau de bord, Assistant
  - **Infrastructure** : Système, Services, (Console — lot 4 uniquement)
  - **Univers** : Matchday, Photos, Jellyfin
  - **Configuration** : Applications, Paramètres, Utilisateurs, Plugins,
    Automatisations, Journal d’activité
- `sidebar.tsx` : groupes avec libellés, item actif, compteurs éventuels,
  pied de sidebar (statut global, utilisateur).
- `mobile-nav.tsx` : 5 entrées, **Assistant en CTA central surélevé**,
  « Plus » ouvre un bottom sheet (pas un menu contextuel brut), zones sûres
  iOS, cibles ≥ 44 px, `aria-current`.
- `topbar.tsx` : recherche/palette (`⌘/Ctrl + K`), notifications, indicateur
  de statut, bascule de thème, avatar. Réutiliser `quick-search.tsx`,
  `notifications-menu.tsx`, `platform-status-indicator.tsx`.
- La palette de commandes doit naviguer, filtrer par rôle et rester utilisable
  au clavier.
- Ne pas afficher d’entrée « Console » tant que le lot 4 n’est pas livré
  (pas de lien mort).
- Conserver le comportement `guest` : les entrées `minRole` restent filtrées
  par `lib/nav-access.ts`.

**Accepté si :** navigation identique au prototype en desktop et mobile,
aucun lien mort, rôles respectés, pas de saut de mise en page à 390 px.

---

## Lot 3 — Pages, dans cet ordre

Pour chaque page : composants partagés, états `loading` / `empty` / `error`,
responsive, clavier, thème clair et sombre.

1. **Tableau de bord** : héro santé, barre de commande, « Aujourd’hui »,
   services, activité récente, applications. Réutiliser les panneaux
   existants (`components/dashboard/*`) ; ne pas appeler l’API depuis les
   composants visuels.
2. **Système** : onglets Vue d’ensemble, Réseau, Stockage, Processus,
   Matériel, Journal.
   - Alimenté par `/api/system/metrics`, `/api/system/network`,
     `/api/system/processes`, `/api/docker/containers`, les connecteurs
     Portainer/Cloudflare/NAS.
   - **Écarts connus à traiter explicitement** : charge moyenne, swap, SMART,
     capteurs, journal systemd, ports en écoute, RAID, sauvegardes, mises à
     jour, faits matériels ne sont pas exposés aujourd’hui. Soit tu ajoutes
     des collecteurs backend **lecture seule** (API Node, `/proc`, connecteurs),
     soit tu affiches « non disponible ». Jamais de valeur inventée.
   - Les collecteurs ajoutés ne doivent pas exiger de privilèges élevés,
     ni exécuter de commande shell avec entrée utilisateur.
3. **Services** : groupes de conteneurs, actions démarrer/arrêter/redémarrer,
   logs. Réutiliser `features/docker/*` et les endpoints existants ; les
   actions restent autorisées côté serveur.
4. **Applications** : registre, statuts, filtres.
5. **Matchday, Photos, Jellyfin** : conserver les fonctionnalités actuelles,
   uniquement retravailler la présentation.
6. **Paramètres, Utilisateurs, Plugins, Connexion, 404** : alignement visuel,
   aucune régression d’auth.

**Accepté si :** chaque page se charge avec l’API réelle, gère l’erreur
réseau, et ne contient aucun chiffre codé en dur.

---

## Lot 4 — Console (uniquement si validé explicitement)

**Principe :** la console n’exécute **pas** de shell. Chaque commande est un
*handler typé* côté serveur qui appelle un connecteur existant ou une lecture
système contrôlée. Aucun `spawn`, aucun `exec`, aucun `sudo` en v1.

- Backend :
  - allowlist fermée de commandes (enum/union typée), pas de parsing libre ;
  - handlers : `martylab status`, `docker ps`, `docker logs <service>`,
    `docker restart <service>` (action sensible), métriques système ;
  - validation stricte des arguments (nom de conteneur ∈ liste connue) ;
  - timeout, taille de sortie bornée, erreurs normalisées ;
  - **rôle `admin` requis** ; `user` et `guest` refusés ;
  - audit en base (`console_audit` : utilisateur, commande, arguments,
    résultat, durée, IP, horodatage), y compris les refus ;
  - ne jamais journaliser de secret, token ou variable d’environnement.
- Front :
  - page dédiée, terminal, historique local, `Ctrl+L`, confirmation explicite
    pour les actions sensibles ;
  - la confirmation est une aide UX, **pas** un contrôle de sécurité : le
    serveur reste seul juge ;
  - badges d’état, journal d’audit paginé.
- Contrats dans `packages/shared`, types stricts, pas de `any`.
- Tests backend (vitest) : allowlist, refus, validation d’arguments, audit,
  contrôle de rôle.

**Accepté si :** aucune commande hors allowlist ne peut s’exécuter, un
`guest` reçoit 403, chaque tentative est auditée, et aucun processus système
n’est lancé.

---

## Lot 5 — Finitions et validation

- États vides et erreurs soignés (pas de « Chargement… » brut).
- Squelettes uniquement là où ils évitent un saut de mise en page.
- Toast léger (primitive maison ou Base UI), pas de dépendance lourde.
- Performance : pas de JS inutile, images dimensionnées, pas de re-render
  massif.
- Accessibilité : parcours clavier complet, `Escape`, focus trap des
  overlays, `aria-live` pour les messages, `prefers-reduced-motion`.
- PWA : incrémenter la version du service worker / cache pour éviter l’ancien
  design en cache.
- Mettre à jour `DECISIONS.md` (jetons, accent, console) et
  `docs/redesign/README.md` (écarts prototype ↔ production).

**Commandes de validation, à exécuter et coller dans le rapport :**

```bash
npm run typecheck
npm run lint
npm run build
npm run test -w @martylab/backend
```

---

## Livrables attendus

1. Un commit par lot, messages conventionnels.
2. Un rapport final court :
   - fichiers créés/modifiés ;
   - décisions prises et alternatives écartées ;
   - écarts entre le prototype et la production (données indisponibles,
     fonctionnalités reportées) ;
   - risques restants ;
   - résultat des commandes de validation.
3. Des captures avant/après desktop (1440 px) et mobile (390 px), clair et
   sombre, pour Tableau de bord, Système et Services.

---

## Ce que tu ne dois pas faire

- Recopier le HTML/CSS du prototype dans React.
- Introduire un routeur, un state manager ou une librairie UI concurrente.
- Exposer un shell, `child_process` avec entrée utilisateur, ou `sudo`.
- Mettre des données de démonstration dans le code de production.
- Modifier les contrats backend pour arranger le front sans validation.
- Supprimer « Automatisations » ou « Journal d’activité ».
- Livrer un lot sans `typecheck` + `build` verts.
- Annoncer une fonctionnalité « terminée » si elle dépend d’une donnée
  inexistante.

## Definition of Done

- [ ] Les 5 lots sont livrés (ou le lot 4 est explicitement reporté).
- [ ] Le portail correspond visuellement au prototype sur les écrans listés.
- [ ] Aucune donnée fictive ne subsiste.
- [ ] Rôles et permissions vérifiés côté serveur.
- [ ] `typecheck`, `lint`, `build`, tests backend : verts.
- [ ] Navigation clavier et lecteur d’écran vérifiés sur 2 pages.
- [ ] Documentation mise à jour.
- [ ] Rapport final fourni.
