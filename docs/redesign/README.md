# Refonte « Cockpit » — prototype cliquable

Prototype statique de la refonte visuelle du portail Martylab.
Il couvre **toutes les pages**, en desktop et en mobile, avec les interactions
principales. Aucun code de production n’est modifié et **toutes les données
affichées sont fictives**.

## Lancer le prototype

```bash
node scripts/serve-redesign.mjs 4173
# http://localhost:4173/
```

Regénérer le sprite d’icônes après ajout d’un pictogramme Lucide :

```bash
node scripts/build-mockup-icons.mjs
```

## Ce que montre le prototype

Direction : « Cockpit » / instrument de précision — surfaces graphite, un seul
accent (vert signal par défaut), lignes de 1 px, chiffres tabulaires,
Bricolage Grotesque / Inter Tight / JetBrains Mono.

- **Pilotage** — Tableau de bord (santé, barre de commande, aujourd’hui), Assistant.
- **Infrastructure** — Système, Services, Console.
- **Univers** — Matchday, Photos, Jellyfin.
- **Configuration** — Applications, Paramètres, Utilisateurs, Plugins.
- **États** — Connexion, Page 404.

Le chrome du studio (hors application) permet de basculer desktop/mobile,
thème sombre/clair et accent coloré. Le prototype n’est pas la cible :
seul le cadre intérieur représente l’application.

### Système — télémétrie complète

Six onglets : Vue d’ensemble, Réseau, Stockage, Processus, Matériel, Journal.
Santé, charge, swap, mises à jour, connecteurs (Portainer, Cloudflare Tunnel,
NAS), conteneurs, interfaces, hôtes publics, ports en écoute, SMART, volumes et
inodes, I/O, RAID, sauvegardes, processus, unités systemd, capteurs,
plateforme, journal filtrable et redémarrages.

### Console — contrôlée par construction

La console n’est **pas** un shell libre :

- allowlist de 11 commandes en lecture ;
- toute autre commande est refusée et journalisée ;
- les actions sensibles (`docker restart`, `systemctl restart`) ouvrent une
  confirmation explicite ;
- chaque exécution ajoute une ligne au journal d’audit (rétention 90 jours) ;
- pas de `sudo`, pas d’élévation, pas de shell arbitraire.

La démo simule ce comportement côté navigateur. En production, la validation
doit être faite **côté serveur**, jamais dans le front.

## Interactions à essayer

- `Ctrl/⌘ + K` : palette de commandes.
- Notifications (cloche), menu du compte, bottom sheet mobile « Plus ».
- Filtres Applications, filtres et recherche du journal système.
- Actions conteneurs et tiroir de logs sur Services.
- Console : `help`, `martylab status`, `docker ps`, `docker logs jellyfin`,
  `docker restart jellyfin` (confirmation), `↑` historique, `Ctrl+L`.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `index.html` | point d’entrée, charge les styles puis les scripts |
| `aura.css` | jetons du design system Aura (copie de reference) |
| `studio.css` | chrome du studio, sidebar, topbar, tab bar, formats |
| `ui.css` | composants partagés : panneaux, boutons, badges, tables, jauges |
| `pages.css` | tableau de bord, applications, services, héro |
| `pages2.css` | système (onglets, journal), console, adaptations mobiles |
| `mockup-helpers.js` | navigation, données de démonstration, helpers de rendu |
| `mockup-pages-a.js` | dashboard, assistant, apps |
| `mockup-pages-b.js` | services, matchday, photos, jellyfin, réglages, users, plugins, login, 404 |
| `mockup-pages-c.js` | système (6 onglets) |
| `mockup-pages-d.js` | console + moteur de démonstration + audit |
| `mockup-app.js` | shell applicatif, navigation, overlays, handlers |
| `icons.js` | sprite généré (Lucide) |

## Migration vers l’application réelle

1. **Jetons** : reprendre les variables de `aura.css` (couleurs, rayons,
   typographies, ombres) dans `packages/ui`.
2. **Composants** : extraire `panel`, `btn`, `badge`, `tbl`, `subnav`,
   `kvrow`, `fact`, `logline`, `term` en composants React typés.
3. **Pages** : porter page par page, en commençant par le tableau de bord puis
   Système (lecture seule), avant Services et Console.
4. **Données** : remplacer les données fictives par TanStack Query + endpoints
   backend ; ne jamais exposer de shell au navigateur.
5. **Console** : allowlist et audit côté serveur, confirmation explicite pour
   les actions sensibles, rôle `guest` exclu.
6. **Mobile** : conserver la tab bar (Accueil, Apps, Assistant, Système, Plus)
   et le bottom sheet, tester clavier et lecteurs d’écran.

## Limites connues

- Données et actions simulées, aucune requête réseau.
- La console est une démonstration : seuls les retours prévus sont produits.
- Les polices viennent de Google Fonts ; prévoir un hébergement local en
  production.

---

## Écarts prototype ↔ production

Cette section est mise à jour après la migration : le prototype reste la
référence visuelle, mais il contient des données fictives et quelques écrans
qui n'ont pas d'équivalent API. Voici ce qui a été livré, adapté, ou
volontairement non implémenté.

### Livré tel quel

- Jetons Cockpit (couleurs, surfaces, lignes, rayons, ombres, typographie) et
  thème clair/sombre.
- Accent vert signal par défaut (le prototype propose aussi teal, violet,
  ambre : non retenus, un seul accent).
- Shell : sidebar groupée (Pilotage, Infrastructure, Univers, Configuration),
  topbar avec palette `Ctrl/⌘ + K`, statut global, notifications, thème et
  compte ; tab bar mobile à 5 entrées avec Assistant surélevé + bottom sheet.
- Tableau de bord : héro santé, panneau « Aujourd'hui », panneau Univers,
  activité récente, registre d'applications.
- Système : six onglets, avec collecteurs `/proc`, `/sys`, `statfs`, `mdstat`
  et `hwmon` en lecture seule.
- Services : conteneurs groupés, états, actions et logs (dialogue).
- Applications, Paramètres, Utilisateurs, Connexion, 404 : alignement visuel,
  aucune régression d'authentification.

### Adapté, faute d'équivalent API

| Prototype | Production |
| --- | --- |
| Barre de commande libre « Demander à Martylab » | Carte d'accès à la page Assistant : aucune commande n'est exécutée depuis le dashboard |
| « 7 services en ligne · dernier incident il y a 12 jours » | Score dérivé des métriques réelles + nombre de conteneurs en marche ; pas d'historique d'incidents (non stocké) |
| Latence par application | Non exposée par le registre de plugins ; seuls version, état et capacités sont affichés |
| Panneau « Aujourd'hui » avec 3 lignes fictives | Lignes réelles Orion / Matchday / Jellyfin, chacune conditionnée à la réponse du connecteur |
| Uptime par conteneur | Non exposé par le connecteur Docker ; le champ `status` brut est affiché |
| Groupes de conteneurs = stacks Compose | Regroupement déduit du nom (les labels Compose ne sont pas collectés) |
| Journal système filtrable, unités systemd, ports en écoute | **Non disponibles** : lecture via `journalctl`/`ss`/`systemctl`, donc processus externe interdit |
| SMART, mises à jour, sauvegardes, DMI/BIOS, alimentation | **Non disponibles** : outils externes ou fonctionnalité non implémentée (ADR-013) |
| Console (allowlist + audit) | **Reportée** (lot 4 non validé) : aucune entrée Console dans la navigation, donc aucun lien mort |
| Actions de conteneur avec confirmation intégrée | Actions autorisées côté serveur (`user` minimum) et feedback par toast ; la confirmation explicite reste réservée à la future console |

### Conservé hors prototype

- « Automatisations » et « Journal d'activité » restent dans la navigation
  (pages « Bientôt disponible »), conformément à la règle de non-régression.
- Le panneau Assistant embarqué du dashboard a été remplacé par une carte vers
  `/assistant` : la fonctionnalité reste accessible sans charger une seconde
  page complète.

### Limites de la recette locale

Les captures de production ont été prises avec le backend dans son conteneur
Linux. Sur un backend Windows, les collecteurs `/proc` renvoient
« non disponible » : c'est volontaire, aucune valeur n'est inventée.
