# Connecteur Matchday

Martylab interroge Matchday via son API HTTP. Matchday reste totalement
indépendant : Martylab ne touche jamais à la base SQLite de Matchday.

Le widget dashboard (option C) affiche un résumé personnalisé : classement,
top 5, prochains matchs et pronostics en attente.

## Configuration

Dans le `.env` du backend Martylab :

```env
MATCHDAY_URL=https://matchday.martylab.fr
MATCHDAY_PUBLIC_URL=https://matchday.martylab.fr
MATCHDAY_GROUP_ID=1
MATCHDAY_SERVICE_USERNAME=martylab
MATCHDAY_SERVICE_PASSWORD=change-me-service-password
MATCHDAY_TIMEOUT_MS=6000
```

### Pronostics personnalisés (optionnel)

Pour afficher le nombre de pronostics en attente **par utilisateur
Martylab**, fournir un mot de passe Matchday par compte :

```env
MATCHDAY_USER_PASSWORDS={"alexandre":"mot-de-passe-matchday"}
```

Les clés JSON correspondent au `username` Martylab (insensible à la casse).

Sans cette variable, le widget affiche le classement via correspondance du
`displayName` Martylab avec le pseudo Matchday, mais `pendingPredictions`
reste `null`.

### Compte service Matchday

Créer un utilisateur dédié (ex. `martylab`) membre du groupe principal.
Ce compte sert à lire le classement et les matchs via l'API Matchday.

## Endpoints Martylab

| Route | Description |
|-------|-------------|
| `GET /api/matchday/status` | Connecteur configuré + Matchday joignable |
| `GET /api/matchday/summary` | Résumé du groupe (classement, matchs, pronos) |

Les deux routes requièrent une session Martylab valide.

## Endpoints Matchday utilisés

| Route Matchday | Usage |
|----------------|-------|
| `GET /api/health` | Vérification de disponibilité |
| `POST /api/auth/login` | Authentification JWT (service ou utilisateur) |
| `GET /api/groups/:id` | Nom du groupe, membres |
| `GET /api/groups/:id/standings` | Classement |
| `GET /api/groups/:id/matches` | Matchs à pronostiquer + prédictions |

## Comportement

- Si `MATCHDAY_URL` ou `MATCHDAY_GROUP_ID` est absent : panneau « non configuré ».
- Si les identifiants service sont absents : `/summary` renvoie 503.
- Si Matchday est hors ligne : état explicite, aucune donnée inventée.
- Le plugin Matchday passe à `enabled: true` quand URL + groupe sont configurés.

## Sécurité

- Les mots de passe Matchday (`MATCHDAY_SERVICE_PASSWORD`, `MATCHDAY_USER_PASSWORDS`)
  restent dans le `.env` serveur uniquement.
- Martylab ne transmet jamais ces secrets au frontend.
- L'API proxy s'appuie sur la session Martylab : chaque utilisateur voit
  son résumé (ou la vue groupe si non lié).
