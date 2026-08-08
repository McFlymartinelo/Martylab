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

# ADR-017 — Connecteur Orion (v0.3, lecture seule)

**Statut : Acceptée**

## Décision

Martylab intègre Orion uniquement via son API HTTP existante :

- `GET /api/health` — disponibilité
- `GET /api/netatmo` — température, humidité, CO₂

Martylab expose `GET /api/orion/status` et `GET /api/orion/climate` au
portail. Aucun accès direct à Netatmo, aux tokens OAuth ou à la base
Orion.

## Raisons

- Orion reste indépendant et déployable sans Martylab.
- Les secrets device (Netatmo, Hue, etc.) restent dans Orion.
- Phase read-only conforme à la règle « pas de fausses données ».

## Conséquences

- Variables : `ORION_URL`, `ORION_API_KEY` (futur), `ORION_TIMEOUT_MS`.
- Plugin Orion `enabled: true` au boot si health check OK.
- Panneau **Maison** sur le dashboard.
- Lumières / actions : phase ultérieure avec modèle de permissions.
