# Connecteur Assistant Martylab

L'Assistant Martylab orchestre des **outils explicites** branchés sur les
plugins (Orion, Matchday, Jellyfin, Docker, Portainer, Cloudflare, NAS).

Il ne manipule jamais l'infrastructure directement : chaque action passe par
un tool enregistré, avec permissions et journalisation.

## Fonctionnalités v0.6

- Interface de conversation (`/assistant`)
- Historique des conversations (PostgreSQL)
- Panneau rapide sur le dashboard
- Registre d'outils avec risques (`read`, `low`, `high`)
- Confirmation obligatoire pour les actions sensibles
- Journal des actions (`GET /api/assistant/actions`)
- Planificateur local (mots-clés FR) + LLM optionnel (OpenAI-compatible)
- Réponse conversationnelle optionnelle après exécution des outils ; sans clé,
  le résumé local reste utilisé
- Clarification demandée par le modèle lorsqu'une cible ou un paramètre manque

## Configuration LLM (optionnel)

Sans LLM, l'assistant utilise un routeur d'intentions simple en français.

```env
ASSISTANT_LLM_BASE_URL=https://api.openai.com/v1
ASSISTANT_LLM_API_KEY=sk-...
ASSISTANT_LLM_MODEL=gpt-4o-mini
ASSISTANT_LLM_TIMEOUT_MS=30000
```

Compatible avec les API qui acceptent les appels d'outils au format OpenAI
(OpenAI, Gemini via son endpoint de compatibilité, OpenRouter et certains
serveurs locaux). Vérifier que le modèle choisi prend en charge les appels
d'outils. Le modèle reçoit le message et les derniers échanges pour choisir
les outils ; après exécution, il reçoit leurs résumés afin de rédiger la réponse.
Les secrets ne sont jamais envoyés au navigateur. Sans LLM ou en cas de panne,
le routeur local et les résumés des connecteurs restent disponibles.

## Endpoints Martylab

| Route | Description |
|-------|-------------|
| `GET /api/assistant/tools` | Outils disponibles pour l'utilisateur courant |
| `GET /api/assistant/conversations` | Liste des conversations |
| `POST /api/assistant/conversations` | Nouvelle conversation |
| `GET /api/assistant/conversations/:id` | Détail + messages |
| `DELETE /api/assistant/conversations/:id` | Supprimer une conversation |
| `POST /api/assistant/conversations/:id/messages` | Envoyer un message |
| `POST /api/assistant/confirmations/:id/approve` | Confirmer une action sensible |
| `POST /api/assistant/confirmations/:id/reject` | Refuser une action sensible |
| `GET /api/assistant/actions` | Journal des actions de l'utilisateur |

Toutes les routes requièrent une session Martylab valide.

## Outils intégrés

| Tool | Plugin | Risque | Rôle min. |
|------|--------|--------|-----------|
| `orion.get_climate` | Orion | read | guest |
| `orion.list_lights` | Orion | read | guest |
| `orion.set_light` | Orion | low | user |
| `matchday.get_summary` | Matchday | read | guest |
| `jellyfin.get_summary` | Jellyfin | read | guest |
| `docker.list_containers` | Docker | read | guest |
| `docker.restart_container` | Docker | high | admin (+ confirmation) |
| `system.get_metrics` | Système | read | guest |
| `portainer.get_overview` | Portainer | read | guest |
| `cloudflare.get_status` | Cloudflare | read | guest |
| `nas.get_status` | NAS | read | guest |

## Sécurité

- Permissions vérifiées côté serveur (`guest` / `user` / `admin`)
- Actions `high` : confirmation utilisateur obligatoire (10 min max)
- Toutes les exécutions sont journalisées
- Pas d'exécution shell libre depuis le langage naturel

## Migration base de données

Les migrations en attente sont appliquées automatiquement au démarrage du
backend. Pour vérifier le résultat après déploiement :

```bash
docker compose logs backend --tail 50
```

Le journal doit contenir `[martylab-migrate] Migrations applied successfully.`.
