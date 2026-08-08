# Martylab — Feuille de route

> Feuille de route générale du projet Martylab.
>
> Cette roadmap évolue avec le projet. Une fonctionnalité peut être déplacée,
> supprimée ou ajoutée si les besoins du projet changent.

---

# 🚀 Version 0.1 — Fondations

Objectif : construire le socle technique de Martylab.

## Dépôt et architecture

- [ ] Mettre en place le monorepo
- [ ] Organiser `apps/`
- [ ] Organiser `packages/`
- [ ] Organiser `plugins/`
- [ ] Mettre en place la documentation
- [ ] Définir les conventions de développement

## Frontend

- [ ] Initialiser le portail React
- [ ] Configurer TypeScript
- [ ] Configurer Vite
- [ ] Configurer Tailwind CSS
- [ ] Configurer shadcn/ui
- [ ] Mettre en place React Router
- [ ] Mettre en place TanStack Query
- [ ] Créer le système de navigation
- [ ] Créer le thème sombre
- [ ] Créer le Design System Martylab
- [ ] Créer le Dashboard

## Backend

- [ ] Initialiser le backend Node.js
- [ ] Configurer Express
- [ ] Configurer TypeScript
- [ ] Créer l'API de base
- [ ] Mettre en place la gestion des erreurs
- [ ] Mettre en place les logs
- [ ] Créer le système de configuration

## Base de données

- [ ] Ajouter PostgreSQL
- [ ] Configurer la connexion
- [ ] Mettre en place les migrations
- [ ] Créer les premiers modèles
- [ ] Créer le système de sauvegarde

## Docker

- [ ] Créer `compose.yaml`
- [ ] Conteneuriser le frontend
- [ ] Conteneuriser le backend
- [ ] Ajouter PostgreSQL
- [ ] Ajouter les healthchecks
- [ ] Configurer les volumes persistants
- [ ] Préparer la configuration de production

## Authentification

- [ ] Créer la connexion
- [ ] Créer la déconnexion
- [ ] Gérer les sessions
- [ ] Créer le rôle administrateur
- [ ] Créer le rôle utilisateur
- [ ] Créer le rôle invité
- [ ] Ajouter Alexandre
- [ ] Ajouter Invité
- [ ] Permettre la création de nouveaux utilisateurs
- [ ] Protéger les routes
- [ ] Ajouter la gestion des permissions

---

# 🖥️ Version 0.2 — Infrastructure

Objectif : permettre à Martylab de surveiller et gérer l'infrastructure.

## Docker

- [ ] Connecteur Docker
- [ ] Liste des conteneurs
- [ ] État des conteneurs
- [ ] Redémarrage d'un conteneur
- [ ] Arrêt d'un conteneur
- [ ] Démarrage d'un conteneur
- [ ] Consultation des logs

## Portainer

- [ ] Connecteur Portainer
- [ ] État de Portainer
- [ ] Conteneurs
- [ ] Images
- [ ] Volumes
- [ ] Actions principales

## Serveur

- [ ] Utilisation CPU
- [ ] Utilisation RAM
- [ ] Utilisation disque
- [ ] Température
- [ ] Uptime
- [ ] État général du serveur

## NAS

- [ ] Connexion au NAS UGREEN
- [ ] Espace disponible
- [ ] Utilisation des volumes
- [ ] État général
- [ ] Informations SMART si disponibles

## Cloudflare

- [ ] Connecteur Cloudflare
- [ ] État du tunnel
- [ ] État des domaines
- [ ] Vérification des services

---

# 🏠 Version 0.3 — Orion

Objectif : intégrer Orion à Martylab.

- [ ] Connecteur Orion
- [ ] Vérification de la connexion
- [ ] État d'Orion
- [ ] Température
- [ ] Humidité
- [ ] Capteurs
- [ ] Lumières
- [ ] Appareils
- [ ] Actions sur les appareils
- [ ] Notifications
- [ ] Historique
- [ ] Dashboard Maison

Orion doit rester totalement indépendant de Martylab.

---

# ⚽ Version 0.4 — Matchday

Objectif : intégrer Matchday à Martylab.

- [ ] Connecteur Matchday
- [ ] Vérification de la connexion
- [ ] Matchs du jour
- [ ] Prochains matchs
- [ ] Classements
- [ ] Pronostics
- [ ] Informations importantes
- [ ] Notifications
- [ ] Dashboard Matchday

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