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