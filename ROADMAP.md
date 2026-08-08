# Martylab — Feuille de route

> Feuille de route générale du projet Martylab.
>
> Cette roadmap évolue avec le projet. Une fonctionnalité peut être déplacée,
> supprimée ou ajoutée si les besoins du projet changent.

## Ordre d'exécution validé

1. **v0.2** — Infrastructure (Portainer, NAS, Cloudflare) ✅
2. **v0.3** — Orion notifications + historique climat
3. **v0.4.x** — Matchday page `/matchday` + matchs du jour
4. **v0.5** — Jellyfin
5. **v0.6** — Assistant
6. **v0.7** — Mobile / PWA

---

# 🚀 Version 0.1 — Fondations

Objectif : construire le socle technique de Martylab.

## Dépôt et architecture

- [x] Mettre en place le monorepo
- [x] Organiser `apps/`
- [x] Organiser `packages/`
- [x] Organiser `plugins/` (manifests déclaratifs ; registre in-memory pour l'instant)
- [x] Mettre en place la documentation
- [x] Définir les conventions de développement

## Frontend

- [x] Initialiser le portail React
- [x] Configurer TypeScript
- [x] Configurer Vite
- [x] Configurer Tailwind CSS
- [x] Configurer shadcn/ui
- [x] Mettre en place React Router
- [x] Mettre en place TanStack Query
- [x] Créer le système de navigation
- [x] Créer le thème sombre
- [x] Créer le Design System Martylab
- [x] Créer le Dashboard

## Backend

- [x] Initialiser le backend Node.js
- [x] Configurer Express
- [x] Configurer TypeScript
- [x] Créer l'API de base
- [x] Mettre en place la gestion des erreurs
- [x] Mettre en place les logs
- [x] Créer le système de configuration

## Base de données

- [x] Ajouter PostgreSQL
- [x] Configurer la connexion
- [x] Mettre en place les migrations
- [x] Créer les premiers modèles
- [x] Créer le système de sauvegarde

## Docker

- [x] Créer `compose.yaml`
- [x] Conteneuriser le frontend
- [x] Conteneuriser le backend
- [x] Ajouter PostgreSQL
- [x] Ajouter les healthchecks
- [x] Configurer les volumes persistants
- [x] Préparer la configuration de production

## Authentification

- [x] Créer la connexion
- [x] Créer la déconnexion
- [x] Gérer les sessions
- [x] Créer le rôle administrateur
- [x] Créer le rôle utilisateur
- [x] Créer le rôle invité
- [x] Ajouter Alexandre
- [x] Ajouter Invité
- [x] Permettre la création de nouveaux utilisateurs
- [x] Protéger les routes
- [x] Ajouter la gestion des permissions (rôles différenciés côté API)

---

# 🖥️ Version 0.2 — Infrastructure

Objectif : permettre à Martylab de surveiller et gérer l'infrastructure.

## Docker

- [x] Connecteur Docker (lecture via socket Unix)
- [x] Liste des conteneurs
- [x] État des conteneurs
- [x] Redémarrage d'un conteneur
- [x] Arrêt d'un conteneur
- [x] Démarrage d'un conteneur
- [x] Consultation des logs

## Portainer

- [x] Connecteur Portainer
- [x] État de Portainer
- [x] Conteneurs
- [x] Images
- [x] Volumes
- [x] Actions principales (start/stop/restart via Portainer)

## Serveur

- [x] Utilisation CPU
- [x] Utilisation RAM
- [x] Utilisation disque
- [x] Température (si capteur disponible sur l'hôte)
- [x] Uptime
- [x] État général du serveur

## NAS

- [x] Connexion au NAS UGREEN (API UGOS)
- [x] Espace disponible (pools de stockage)
- [x] Utilisation des volumes
- [x] État général (CPU, RAM, température)
- [x] Informations disques (température / statut)

## Cloudflare

- [x] Connecteur Cloudflare
- [x] État du tunnel
- [x] État des domaines (checks HTTP configurables)
- [x] Vérification des services

---

# 🏠 Version 0.3 — Orion

Objectif : intégrer Orion à Martylab.

- [x] Connecteur Orion
- [x] Vérification de la connexion
- [x] État d'Orion
- [x] Température
- [x] Humidité
- [ ] Capteurs
- [x] Lumières
- [ ] Appareils
- [x] Actions sur les appareils (Hue on/off)
- [ ] Notifications
- [ ] Historique
- [x] Dashboard Maison

Orion doit rester totalement indépendant de Martylab.

---

# ⚽ Version 0.4 — Matchday

Objectif : intégrer Matchday à Martylab.

## v0.4.1 — Widget dashboard (option C) ✅

- [x] Connecteur Matchday (proxy API, compte service)
- [x] Vérification de la connexion (`/api/matchday/status`)
- [x] Prochains matchs + pronostics (vue groupe)
- [x] Classements (top 5 + rang utilisateur)
- [x] Pronostics en attente (personnalisés via `MATCHDAY_USER_PASSWORDS`)
- [x] Dashboard Matchday (panneau résumé)

## Suite v0.4.x

- [ ] Matchs du jour (vue dédiée)
- [ ] Informations importantes (annonces groupe)
- [ ] Notifications Matchday
- [ ] Page `/matchday` (lanceur — option B)

Matchday doit rester totalement indépendant de Martylab.

---

# 🎬 Version 0.5 — Médias

Objectif : intégrer Jellyfin.

## Jellyfin

- [ ] Connecteur Jellyfin
- [ ] Vérification de la connexion
- [ ] Bibliothèques
- [ ] Médias récemment ajoutés
- [ ] Continuer la lecture
- [ ] Films
- [ ] Séries
- [ ] Informations de lecture
- [ ] Statut du serveur

---

# 🤖 Version 0.6 — Martylab Assistant

Objectif : créer le véritable assistant de Martylab.

## Interface

- [ ] Interface de conversation
- [ ] Historique des conversations
- [ ] Interface responsive
- [ ] Accès rapide depuis le Dashboard
- [ ] Panneau Assistant

## Système d'outils

- [ ] Système de Tools
- [ ] Système de permissions
- [ ] Intégration des plugins
- [ ] Outils en lecture seule
- [ ] Outils permettant des actions
- [ ] Confirmation des actions sensibles
- [ ] Journal des actions

## Intégrations

- [ ] Tool Orion
- [ ] Tool Matchday
- [ ] Tool Jellyfin
- [ ] Tool Docker
- [ ] Tool NAS
- [ ] Tool Cloudflare

---

# 📱 Version 0.7 — Mobile

Objectif : rendre Martylab parfaitement utilisable sur mobile.

- [ ] Responsive complet
- [ ] Navigation mobile
- [ ] PWA
- [ ] Installation sur smartphone
- [ ] Notifications push
- [ ] Optimisation des performances
- [ ] Interface tactile

---

# 🧠 Version 0.8 — Intelligence

Objectif : rendre l'Assistant réellement intelligent.

- [ ] Mémoire utilisateur
- [ ] Préférences utilisateur
- [ ] Contexte des conversations
- [ ] Suggestions
- [ ] Automatisations
- [ ] Planification d'actions
- [ ] Exécution multi-plugins
- [ ] Modèle IA configurable
- [ ] Possibilité d'utiliser une IA locale

---

# 🔮 Fonctionnalités futures

Ces fonctionnalités ne sont pas prioritaires et ne doivent pas être développées prématurément.

- [ ] Frigate
- [ ] Immich
- [ ] Plex
- [ ] MQTT
- [ ] Home Assistant
- [ ] Gestion avancée du NAS
- [ ] Automatisations avancées
- [ ] Interface vocale
- [ ] Assistant local
- [ ] Application mobile native

---

# Principe de la roadmap

La roadmap est une direction, pas une obligation.

Une fonctionnalité peut être :

- déplacée ;
- supprimée ;
- remplacée ;
- divisée en plusieurs fonctionnalités.

Toute modification importante de l'architecture doit être documentée dans `DECISIONS.md`.
