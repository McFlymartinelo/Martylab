# Martylab — Décisions techniques

Ce document contient les principales décisions d'architecture prises pour Martylab.

L'objectif est de conserver l'historique des choix importants afin d'éviter de remettre en question constamment les mêmes décisions.

---

# ADR-001 — React

**Statut : Acceptée**

## Décision

Le portail Martylab utilise React.

## Raisons

- Écosystème mature.
- Architecture par composants.
- Très bon support de TypeScript.
- Adapté aux interfaces complexes.
- Technologie déjà proche des compétences du projet.

---

# ADR-002 — Vite

**Statut : Acceptée**

## Décision

Vite est utilisé comme outil de développement et de build du frontend.

## Raisons

- Démarrage rapide.
- Excellente expérience de développement.
- Configuration relativement simple.
- Très bon support de React.
- Outil moderne et largement utilisé.

---

# ADR-003 — TypeScript

**Statut : Acceptée**

## Décision

TypeScript est obligatoire pour le code applicatif Martylab.

## Raisons

- Sécurité du typage.
- Meilleure maintenabilité.
- Autocomplétion.
- Détection de nombreuses erreurs avant exécution.
- Meilleur partage des contrats entre frontend et backend.

Le mode strict doit être utilisé.

---

# ADR-004 — Express

**Statut : Acceptée**

## Décision

Le backend Martylab utilise Node.js avec Express et TypeScript.

## Raisons

- Technologie mature.
- Simple à maintenir.
- Bonne connaissance de cet environnement.
- Compatible avec les besoins actuels de Martylab.
- Cohérence avec les autres projets du même environnement.

---

# ADR-005 — PostgreSQL

**Statut : Acceptée**

## Décision

PostgreSQL est utilisé comme base de données principale de Martylab.

## Raisons

- Robuste.
- Mature.
- Fiable.
- Transactions.
- Bon support des données relationnelles.
- Adapté aux utilisateurs, permissions, plugins, notifications et données de l'Assistant.

Les applications externes conservent leurs propres bases de données.

---

# ADR-006 — Docker

**Statut : Acceptée**

## Décision

Martylab est déployé avec Docker et Docker Compose.

## Raisons

- Déploiement reproductible.
- Isolation des services.
- Gestion simple des dépendances.
- Mise à jour facilitée.
- Cohérence entre les différents services du serveur.

---

# ADR-007 — Développement Windows / production Debian

**Statut : Acceptée**

## Décision

Le développement de Martylab est effectué sur Windows.

La production est exécutée sur le serveur Debian.

## Flux

```text
Windows
   ↓
Cursor
   ↓
Git
   ↓
GitHub
   ↓
Debian
   ↓
Docker
```

---

# ADR-008 — npm workspaces

**Statut : Acceptée**

## Décision

Martylab utilise npm comme gestionnaire de paquets, avec des npm workspaces.

## Raisons

- Le dépôt s'appuie sur `package-lock.json`.
- Évite une migration vers pnpm ou yarn.
- Suffisant pour un monorepo simple en v0.1.
- Compatible avec le flux de développement Windows et le déploiement Debian.

---

# ADR-009 — Périmètre monorepo v0.1

**Statut : Acceptée**

## Décision

Pour Martylab v0.1, le monorepo contient uniquement :

- `apps/portal`
- `apps/backend`
- `packages/shared`

## Raisons

- Réduit la complexité initiale.
- Évite les packages vides (`ui`, `auth`, `api-client`, etc.).
- `packages/shared` sert aux types et contrats réellement partagés.
- D'autres packages pourront être ajoutés plus tard selon un besoin concret.

---

# ADR-010 — Drizzle ORM

**Statut : Acceptée**

## Décision

Le backend utilise Drizzle ORM avec PostgreSQL et Drizzle Kit pour les migrations.

## Raisons

- Approche légère.
- Migrations SQL explicites.
- Moins d'abstraction qu'un ORM plus lourd.
- Adapté à une architecture simple et maintenable.

---

# ADR-011 — Authentification par sessions

**Statut : Acceptée**

## Décision

L'authentification Martylab utilise des sessions stockées côté serveur avec un cookie HttpOnly sécurisé.

## Raisons

- Évite le stockage de JWT dans `localStorage`.
- Meilleur contrôle de révocation des sessions.
- Aligné avec une application web first-party.

## Contraintes cookie

- `HttpOnly`
- `Secure` en production
- `SameSite` approprié
- expiration / durée de session explicite

Les autorisations sont toujours vérifiées côté backend.

---

# ADR-012 — Tailwind CSS v4 et shadcn/ui (Base UI)

**Statut : Acceptée**

## Décision

Le portail utilise Tailwind CSS v4 et shadcn/ui avec Base UI comme primitive, via des CSS variables et un thème sombre préparé.

## Raisons

- Configuration moderne recommandée par shadcn/ui.
- Base UI est le choix retenu pour les primitives.
- Les CSS variables permettent l'évolution du Design System Martylab.
- Pas de rétrogradation vers Tailwind v3.

---

# ADR-013 — Sauvegardes PostgreSQL reportées

**Statut : Acceptée**

## Décision

La sauvegarde automatique de PostgreSQL est reportée après v0.1.

## Raisons

- Ne doit pas bloquer les fondations.
- L'architecture devra toutefois permettre d'ajouter plus tard sauvegarde, restauration, rotation et éventuellement copie vers le NAS.

Aucun système de sauvegarde complexe n'est mis en place en v0.1.

---

# ADR-014 — Entrée publique via Cloudflare Tunnel + portal :3100

**Statut : Acceptée**

## Décision

L'accès public à Martylab passe par Cloudflare Tunnel vers le portal publié sur l'hôte en `:3100`.

Le backend et PostgreSQL restent internes au réseau Docker `martylab`.

Le hostname public prévu est `https://martylab.martylab.fr`.

## Raisons

- Évite d'exposer Matchday (`:3000`) ou d'autres services.
- Même origine navigateur (`/` et `/api`) pour les cookies de session.
- Cohérent avec l'architecture déjà utilisée pour les autres applications du serveur.

## Conséquences

- `CORS_ORIGIN=https://martylab.martylab.fr`
- `COOKIE_SECURE=true` en production HTTPS
- Documentation opérationnelle dans `docs/cloudflare-tunnel.md`
- Aucun token Cloudflare dans le dépôt Git

---

# ADR-015 — Design System v1 (sidebar responsive, palette violette, recharts)

**Statut : Acceptée**

## Décision

Le portail adopte une disposition à sidebar (desktop/tablette ≥ `md`) avec
barre de navigation basse dédiée sur mobile (< `md`), plutôt qu'une simple
barre de navigation horizontale.

Une palette violette (accent `oklch(... 293)`) remplace la palette neutre,
avec le thème sombre comme thème par défaut (`ThemeProvider`
`defaultTheme="dark"`). Le thème clair reste disponible via le sélecteur
existant.

`recharts` est ajouté comme librairie de graphiques (jauges radiales,
sparklines) pour le panneau "Système" du tableau de bord.

## Raisons

- Aligné avec la maquette de référence du produit (sidebar + palette violette
  + navigation mobile dédiée).
- La sidebar reste utilisable en tablette comme en desktop ; le mobile garde
  une expérience tactile dédiée (barre basse + menu "Plus").
- `recharts` a un bon support TypeScript et s'intègre proprement avec
  Tailwind (couleurs via variables CSS).

## Alternatives considérées

- Garder la barre horizontale : rejetée, ne passe pas à l'échelle avec 9+
  entrées de navigation prévues par la roadmap.
- Bibliothèque de graphiques plus légère (ex: SVG fait main) : rejetée pour
  l'instant, `recharts` couvre mieux les besoins futurs (v0.2, métriques
  serveur) sans réécriture.

## Conséquences

- Toutes les entrées de navigation prévues par la roadmap (`Système`,
  `Services`, `Utilisateurs`, `Plugins`, `Automations`, `Journal d'activité`,
  `Paramètres`) sont visibles dans la sidebar dès maintenant, mais pointent
  vers une page générique "Bientôt disponible" tant que la fonctionnalité
  backend correspondante n'existe pas. Aucune donnée n'y est inventée.
- Les métriques serveur (CPU, RAM, stockage, température) affichent un état
  vide explicite ("Connecteur serveur non configuré") tant que le connecteur
  serveur (v0.2) n'est pas implémenté, conformément à la règle interdisant les
  données fictives en production.
- Le composant `SystemPanel` (qui embarque `recharts`) est chargé en lazy
  loading (`React.lazy`) pour ne pas alourdir le chargement initial du
  tableau de bord.

---

# ADR-016 — Connecteurs serveur et Docker (v0.2)

**Statut : Acceptée**

## Décision

Martylab expose deux connecteurs d'infrastructure intégrés au backend :

1. **Connecteur serveur** — `GET /api/system/metrics` lit CPU, RAM, disque,
   uptime et température (si capteur disponible) via `/proc` et `/sys`.
2. **Connecteur Docker** — `GET /api/docker/containers` interroge l'API
   Engine via un socket Unix (`DOCKER_SOCKET_PATH`).

En production Debian, le `compose.yaml` monte `/proc`, `/sys`, `/` (lecture
seule) et `/var/run/docker.sock` dans le conteneur backend, avec
`group_add` pour l'accès au socket Docker.

Sans ces montages, le backend remonte les métriques du **conteneur** lui-même
(comportement honnête, sans données inventées).

## Raisons

- Permet d'alimenter le dashboard et la page Système avec de vraies métriques.
- Préserve l'indépendance des applications : pas d'accès direct à leurs bases.
- Le socket Docker en lecture seule est un compromis courant pour la supervision.

## Alternatives considérées

- Agent séparé sur l'hôte : plus propre mais plus complexe pour v0.2.
- Bibliothèque `dockerode` : rejetée, l'API HTTP native via socket Unix suffit
  pour la lecture.
- `systeminformation` npm : rejetée, lecture directe de `/proc` plus légère et
  prévisible.

## Conséquences

- Variables d'environnement : `HOST_PROC_PREFIX`, `HOST_SYS_PREFIX`,
  `HOST_ROOT_PATH`, `DOCKER_SOCKET_PATH`, `DOCKER_GID`.
- Plugins Orion et Matchday enregistrés comme stubs (`enabled: false`) au
  démarrage du backend.
- Actions Docker (start/stop/restart/logs) restent hors scope pour l'instant.

---

# ADR-017 — Connecteur Orion (v0.3)

**Statut : Acceptée (étendue v0.3.1 — lumières Hue)**

## Décision

Martylab intègre Orion uniquement via son API HTTP existante :

- `GET /api/health` — disponibilité
- `GET /api/netatmo` — température, humidité, CO₂
- `GET /api/hue/lights` / `PUT /api/hue/lights/:id` — lumières Hue

Martylab expose :

- `GET /api/orion/status`, `GET /api/orion/climate` (lecture)
- `GET /api/orion/lights`, `PUT /api/orion/lights/:id` (lecture + actions Hue)

Aucun accès direct à Netatmo, Hue, aux tokens OAuth ou à la base Orion.

## Raisons

- Orion reste indépendant et déployable sans Martylab.
- Les secrets device (Netatmo, Hue, etc.) restent dans Orion.
- Pas de fausses données : états explicites si Orion ou Hue est indisponible.

## Conséquences

- Variables : `ORION_URL`, `ORION_API_KEY` (futur), `ORION_TIMEOUT_MS`.
- Plugin Orion `enabled: true` quand `ORION_URL` est configuré.
- Panneau **Maison** (climat) + **Lumières** sur le dashboard.
- Actions Hue : `requireMinRole("user")` — invités en lecture seule.

---

# ADR-018 — Connecteur Matchday (v0.4.1)

**Statut : Acceptée**

## Décision

Martylab intègre Matchday via son API HTTP avec authentification JWT :

- Compte **service** (`MATCHDAY_SERVICE_*`) pour lire groupe, classement et matchs.
- Optionnel : `MATCHDAY_USER_PASSWORDS` pour authentifier chaque utilisateur
  Martylab et calculer ses pronostics en attente.

Martylab expose :

- `GET /api/matchday/status` — disponibilité
- `GET /api/matchday/summary` — résumé dashboard (top 5, rang, prochains matchs)

Le widget dashboard (option C) affiche des données personnalisées sans iframe
ni redirection obligatoire vers Matchday.

## Raisons

- Matchday reste indépendant (base SQLite, déploiement, auth propres).
- Les mots de passe Matchday ne transitent jamais vers le frontend.
- Correspondance `displayName` / `username` Martylab → pseudo Matchday pour le rang.
- Pas de fausses données : états explicites si non configuré ou hors ligne.

## Conséquences

- Variables : `MATCHDAY_URL`, `MATCHDAY_PUBLIC_URL`, `MATCHDAY_GROUP_ID`,
  `MATCHDAY_SERVICE_USERNAME`, `MATCHDAY_SERVICE_PASSWORD`,
  `MATCHDAY_USER_PASSWORDS`, `MATCHDAY_TIMEOUT_MS`.
- Plugin Matchday `enabled: true` quand URL + groupe sont configurés.
- Panneau **Matchday** sur le dashboard.
- Page dédiée `/matchday` et notifications : hors scope v0.4.1.

---

# ADR-019 — Refonte « Cockpit » (tokens, accent signal, shell groupé)

**Statut : Acceptée**

## Décision

Le portail adopte l'identité « Cockpit » du prototype `docs/redesign/` :

- les jetons Aura sont **remappés sur les variables shadcn existantes**
  (`--background`, `--primary`, `--border`, etc.) ; il n'existe pas de second
  système de CSS ;
- l'accent par défaut devient le **vert signal** (`oklch(52% 0.135 138)` en
  clair, `oklch(72% 0.12 138)` en sombre). Le violet n'est plus la couleur
  primaire ; `theme_color` PWA et `meta[name=theme-color]` suivent ;
- trois familles auto-hébergées via `@fontsource-variable` (sous-ensemble
  latin uniquement, `font-display: swap`) : **Bricolage Grotesque** (display),
  **Inter Tight** (UI), **JetBrains Mono** (chiffres et codes) ;
- rayons alignés sur le prototype (panneaux 15 px, héro 21 px via
  `--radius: 0.9375rem`) ;
- la navigation est regroupée en **Pilotage / Infrastructure / Univers /
  Configuration** ; la tab bar mobile garde 5 entrées avec l'Assistant en
  action centrale surélevée et un bottom sheet « Plus » ;
- la recherche devient une **palette de commandes** (`Ctrl/⌘ + K`) filtrée par
  rôle.

## Raisons

- Alignement avec la référence visuelle validée du produit.
- Un seul jeu de tokens : les composants shadcn continuent de fonctionner sans
  réécriture.
- L'accent unique et les lignes de 1 px correspondent à la direction
  « instrument de précision » demandée.

## Alternatives considérées

- Conserver le violet : rejeté, le prototype définit le vert signal comme
  accent par défaut.
- Ajouter un fichier `aura.css` parallèle : rejeté, duplication de tokens et
  risque de divergence avec shadcn.
- Garder le menu déroulant mobile : rejeté, cibles trop petites et pas de zone
  sûre iOS ; le bottom sheet est retenu.

## Conséquences

- Les contrastes texte/fond des couples principaux et des badges
  `success` / `warn` / `danger` sont vérifiés AA (voir rapport de migration).
- Les polices ne viennent plus de Google Fonts ; seuls les sous-ensembles
  latins sont précachés.
- « Automatisations » et « Journal d'activité » restent dans la navigation,
  même si le prototype ne les montre pas.
- Aucune nouvelle dépendance UI : Base UI, déjà présent, fournit le dialogue,
  le menu et les notifications.

---

# ADR-020 — Télémétrie système en lecture seule, console reportée

**Statut : Acceptée**

## Décision

La page **Système** est alimentée par des collecteurs backend en **lecture de
fichiers uniquement** :

- `GET /api/system/overview` : `/proc/loadavg`, `/proc/meminfo` (swap),
  `/proc/stat` (btime), `/proc/cpuinfo`, `/proc/sys/kernel/*`, `os-release` ;
- `GET /api/system/storage` : `/proc/mounts` + `statfs` (volumes et inodes),
  `/proc/diskstats` (débits calculés par échantillonnage), `/proc/mdstat`
  (RAID) ;
- `GET /api/system/hardware` : `/sys/class/hwmon` (capteurs, ventilateurs) et
  faits plateforme ;
- `/api/system/network` expose en plus l'état, la MAC, le débit négocié, le
  MTU, les paquets et les erreurs par interface ;
- `/api/system/processes` expose l'UID, la ligne de commande et le temps CPU
  cumulé.

Les montages `HOST_PROC_PREFIX`, `HOST_SYS_PREFIX` et `HOST_ROOT_PATH` restent
ceux d'ADR-016. Aucun `child_process`, `spawn`, `exec` ou `sudo` n'est utilisé.

Les données qui exigeraient un processus externe restent **non disponibles**
et sont affichées comme telles : SMART (`smartctl`), journal systemd et unités
(`journalctl`/`systemctl`), ports en écoute (`ss`), mises à jour (`apt`),
sauvegardes (non implémentées, ADR-013), DMI/BIOS (`dmidecode`) et
consommation électrique.

La **Console** (allowlist typée + audit) n'est pas livrée dans cette passe :
l'entrée de navigation n'est pas affichée et le sujet reste à valider
séparément.

## Raisons

- La règle « pas de shell libre » interdit les collecteurs qui dépendraient de
  commandes arbitraires.
- Les onglets Système devaient être utiles sans jamais inventer de valeur.
- La console est une surface de sécurité à part entière (allowlist, audit,
  rôle admin, tests) et mérite sa propre revue.

## Conséquences

- Le backend doit pouvoir lire `/host/proc` et `/host/sys` en production pour
  remonter les métriques de l'hôte ; sinon il remonte celles du conteneur.
- Les parseurs (`loadavg`, `diskstats`, `mdstat`, `mounts`, `os-release`) sont
  couverts par des tests unitaires.
- Toute nouvelle donnée « cockpit » devra soit provenir d'un collecteur en
  lecture seule, soit être explicitement marquée non disponible.

---

# ADR-021 — Console : allowlist typée + terminal conteneur

**Statut : Acceptée**

## Contexte

ADR-020 avait reporté la Console et posé la règle « pas de shell libre ».
Le besoin exprimé ensuite est plus large : un accès direct au terminal est
souhaité pour diagnostiquer les services, sans transformer Martylab en porte
d'entrée vers le shell de l'hôte Debian.

## Décision

La Console expose **deux niveaux distincts**, tous deux réservés au rôle
`admin` et revérifiés côté serveur :

1. **Commandes typées** — allowlist de 14 commandes (`help`, `status`,
   `containers`, `docker logs`, `disk`, `network`, `processes`, `hardware`,
   `uname`, `uptime`, `audit`, `docker start|stop|restart`). Chaque commande
   est résolue vers un collecteur en lecture seule ou un connecteur existant.
   Aucun `child_process`, `spawn`, `exec`, `sudo` ou shell hôte. Les commandes
   `write`/`destructive` exigent `confirm: true` (HTTP 428 sinon) et sont
   journalisées dans `console_audit` (compte, commande, risque, statut,
   aperçu, durée).

2. **Terminal conteneur** — WebSocket same-origin
   (`/api/console/terminal`) relié à un `docker exec` TTY dans un conteneur
   explicitement choisi. Le backend vérifie le cookie de session, le rôle
   admin et l'en-tête `Origin` (anti-CSRF WebSocket), n'accepte que les shells
   `/bin/sh`, `/bin/bash`, `/bin/ash` et ferme la session après 30 minutes
   d'inactivité. L'interface utilise xterm.js. `CONSOLE_TERMINAL_ENABLED=false`
   retire complètement le canal.

## Garanties

- Aucun accès au shell de l'hôte : le terminal ne peut ouvrir qu'un conteneur
  Docker existant, via le socket Docker.
- Le socket Docker reste monté en lecture seule côté système de fichiers ;
  les opérations `exec` passent par l'API.
- Toute tentative de commande inconnue est refusée et auditée.
- La Console n'apparaît dans la navigation que pour les administrateurs
  (`minRole: admin`), et la route React est protégée par `RequireAdmin`.
- nginx doit relayer l'`Upgrade` WebSocket ; c'est une `location` dédiée avec
  `proxy_buffering off` et un timeout d'une heure.

## Alternatives écartées

- **Shell hôte via SSH** : accès total au Debian, stockage d'identifiants SSH
  et nouvelle surface d'attaque. Non retenu ; nécessiterait son propre ADR.
- **Exécution de commandes arbitraires via `child_process`** : viole ADR-020
  et le principe de moindre privilège.
- **Terminal dans le conteneur backend uniquement** : ne rend pas service pour
  diagnostiquer les autres services.

## Conséquences

- Nouvelles dépendances : `ws` (backend), `@xterm/xterm` et
  `@xterm/addon-fit` (portail, chargés uniquement avec la page Console).
- Migration `0003_console_audit.sql` et table `console_audit`.
- Nouvelles routes : `/api/console/commands`, `/api/console/execute`,
  `/api/console/audit`, et le canal WebSocket `/api/console/terminal`.
- `GET /api/system/live` expose CPU, RAM, disque, uptime et réseau sans le
  scan des processus ; il alimente le rafraîchissement à la seconde de la page
  Système. `/api/system/metrics` reste disponible mais n'est plus pollé par le
  portail (les processus passent par `/api/system/processes`).
- Les sessions de la page Paramètres sont listables et révocables
  (`GET /api/auth/sessions`, `DELETE /api/auth/sessions/:id`,
  `POST /api/auth/sessions/revoke-others`).
