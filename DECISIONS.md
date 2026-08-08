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
