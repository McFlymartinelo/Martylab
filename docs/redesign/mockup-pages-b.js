/* ==========================================================================
   Martylab — prototype « Cockpit »
   Écrans : Matchday, Photos, Jellyfin, Services, Paramètres, Utilisateurs,
   Plugins, Connexion, 404.
   ========================================================================== */

(function (ML) {
  const { icon, dot, badge, bar, pagehead, kpi, avatar } = ML;

  /* ---------------------------------------------------------------------- */
  /* Matchday                                                                */
  /* ---------------------------------------------------------------------- */

  ML.pages.matchday = {
    title: "Matchday",
    render() {
      const today = [
        { time: "18:30", teams: "Martigues – Nîmes", meta: "National · J14", right: badge("à venir", "") },
        { time: "20:45", teams: "SCO – OM", meta: "Ligue 1 · J12", right: badge("prono 2–1", "ok") },
        { time: "21:00", teams: "Real – Barça", meta: "Liga · J13", right: badge("verrouillé", "") },
      ];
      const upcoming = [
        { time: "sam. 17:00", teams: "PSG – Lens", meta: "Ligue 1 · J13", right: badge("à pronostiquer", "accent") },
        { time: "dim. 15:00", teams: "Lyon – Nice", meta: "Ligue 1 · J13", right: badge("à pronostiquer", "accent") },
        { time: "dim. 20:45", teams: "Milan – Inter", meta: "Serie A · J12", right: badge("à pronostiquer", "accent") },
      ];
      const standings = [
        { rank: 1, name: "Camille", pts: 162 },
        { rank: 2, name: "Toi", pts: 148, you: true },
        { rank: 3, name: "Hugo", pts: 141 },
        { rank: 4, name: "Léa", pts: 137 },
        { rank: 5, name: "Sam", pts: 129 },
      ];
      const messages = [
        { author: "Camille", time: "08:12", body: "Le SCO va encore nous surprendre, j’y crois." },
        { author: "Hugo", time: "08:31", body: "J’ai mis 1–1, je reste prudent cette fois." },
        { author: "Léa", time: "09:02", body: "Qui regarde le match ce soir ?" },
      ];

      return `
        ${pagehead({
          eyebrow: "Matchday · Ligue des copains",
          title: "Le match, sans quitter le labo.",
          sub: "Matchs du jour, pronostics et classement du groupe. Les actions restent dans Matchday.",
          actions: `<button class="btn" data-toast="Ouverture de Matchday (démonstration)">${icon("external-link")} Ouvrir Matchday</button>`,
        })}

        <section class="panel panel--hero">
          <div class="row row--between" style="margin-bottom:10px">
            <span class="eyebrow">Prochain match · Ligue 1 · J12</span>
            ${badge("dans 3 h 12", "accent")}
          </div>
          <div class="matchhero">
            <div class="team">
              <div class="team__crest">SCO</div>
              <div class="team__name">Angers SCO</div>
              <div class="team__sub">9e · 17 pts</div>
            </div>
            <div class="matchhero__score">
              <b>— : —</b>
              <span>ce soir · 20:45</span>
            </div>
            <div class="team">
              <div class="team__crest">OM</div>
              <div class="team__name">Olympique Marseille</div>
              <div class="team__sub">2e · 26 pts</div>
            </div>
          </div>
          <div class="prediction">
            <label>Ton pronostic</label>
            <input class="predbox" value="2" aria-label="Buts Angers">
            <span class="muted">–</span>
            <input class="predbox" value="1" aria-label="Buts Marseille">
            <button class="btn btn--primary btn--sm" data-toast="Pronostic enregistré (démonstration)">Valider</button>
          </div>
        </section>

        <div class="grid-3 section">
          <div class="panel" style="padding:13px 15px">${kpi("Ton classement", "2", "e", "148 points · +6 ce week-end")}</div>
          <div class="panel" style="padding:13px 15px">${kpi("Pronostics", "3", "en attente", "avant samedi 15:00")}</div>
          <div class="panel" style="padding:13px 15px">${kpi("Groupe", "11", "joueurs", "2 actifs aujourd’hui")}</div>
        </div>

        <div class="grid-2 section">
          <section class="panel">
            <div class="panel__head"><span class="panel__title">${icon("calendar")} Matchs du jour</span><span class="panel__hint">Europe/Paris</span></div>
            ${today.map((m) => `
              <div class="matchrow">
                <span class="matchrow__time mono">${m.time}</span>
                <div class="matchrow__body"><div class="matchrow__teams">${m.teams}</div><div class="matchrow__meta">${m.meta}</div></div>
                ${m.right}
              </div>`).join("")}
          </section>

          <section class="panel">
            <div class="panel__head"><span class="panel__title">${icon("clock")} À pronostiquer</span><span class="panel__hint">3 matchs</span></div>
            ${upcoming.map((m) => `
              <div class="matchrow">
                <span class="matchrow__time mono">${m.time}</span>
                <div class="matchrow__body"><div class="matchrow__teams">${m.teams}</div><div class="matchrow__meta">${m.meta}</div></div>
                ${m.right}
              </div>`).join("")}
          </section>
        </div>

        <div class="grid-2 section">
          <section class="panel">
            <div class="panel__head"><span class="panel__title">${icon("trophy")} Classement</span><span class="panel__hint">J12</span></div>
            ${standings.map((s) => `
              <div class="standing ${s.you ? "is-you" : ""}">
                <span class="standing__rank">${s.rank}</span>
                <span class="standing__name">${s.name}</span>
                <span class="standing__pts">${s.pts} pts</span>
              </div>`).join("")}
          </section>

          <section class="panel">
            <div class="panel__head"><span class="panel__title">${icon("message-square")} Groupe</span><span class="panel__hint">3 messages</span></div>
            ${messages.map((m) => `
              <div class="msg">
                <div class="msg__head"><span class="msg__author">${m.author}</span><span class="msg__time">${m.time}</span></div>
                <div class="msg__body">${m.body}</div>
              </div>`).join("")}
          </section>
        </div>
      `;
    },
  };

  /* ---------------------------------------------------------------------- */
  /* Photos                                                                  */
  /* ---------------------------------------------------------------------- */

  ML.pages.photos = {
    title: "Photos",
    render() {
      const albums = [
        { title: "Été 2026", count: "284", variant: 1, shared: false },
        { title: "Japon", count: "1 042", variant: 2, shared: true },
        { title: "Montagne", count: "196", variant: 4, shared: false },
        { title: "Famille", count: "512", variant: 5, shared: true },
        { title: "Week-end Lyon", count: "87", variant: 3, shared: false },
        { title: "Noël 2025", count: "143", variant: 6, shared: true },
      ];

      return `
        ${pagehead({
          eyebrow: "Immich · 2 instances",
          title: "Photos",
          sub: "Les bibliothèques personnelles et partagées, sans exposer les clés API au navigateur.",
          actions: `
            <button class="btn" data-toast="Ouverture d’Immich (démonstration)">${icon("external-link")} Ouvrir Immich</button>`,
        })}

        <div class="filterbar">
          <div class="chips">
            <button class="chip is-active" data-toast="Instance personnelle (démonstration)">${icon("images")} Perso · Alexandre</button>
            <button class="chip" data-toast="Instance partagée (démonstration)">${icon("users")} Partagé</button>
          </div>
          <span class="filterbar__spacer"></span>
          ${badge("connecté", "ok")}
          <span class="tiny">v1.119.0</span>
        </div>

        <div class="grid-3" style="margin-bottom:14px">
          <div class="panel" style="padding:13px 15px">${kpi("Photos", "12 480", "", "dont 284 ce mois-ci")}</div>
          <div class="panel" style="padding:13px 15px">${kpi("Vidéos", "312", "", "42 h 18 de contenu")}</div>
          <div class="panel" style="padding:13px 15px">${kpi("Albums", "18", "", "3 partagés publiquement")}</div>
        </div>

        <section class="panel">
          <div class="panel__head"><span class="panel__title">${icon("images")} Albums</span><span class="panel__hint">Triés par activité</span></div>
          <div class="albumgrid">
            ${albums.map((a) => `
              <article class="album">
                <div class="album__cover album__cover--${a.variant}">
                  <span class="album__grain"></span>
                  <span class="album__badge">${icon(a.shared ? "users" : "images")} ${a.count}</span>
                </div>
                <div class="album__title">${a.title}</div>
                <div class="album__meta">${a.count} éléments${a.shared ? " · partagé" : " · privé"}</div>
              </article>`).join("")}
          </div>
        </section>

        <p class="tiny" style="margin-top:12px">Miniatures et affiches servies via Martylab · les clés API ne quittent jamais le backend.</p>
      `;
    },
  };

  /* ---------------------------------------------------------------------- */
  /* Jellyfin                                                                */
  /* ---------------------------------------------------------------------- */

  ML.pages.jellyfin = {
    title: "Jellyfin",
    render() {
      const libs = [
        { name: "Films", count: "1 842" },
        { name: "Séries", count: "96" },
        { name: "Animation", count: "214" },
        { name: "Documentaires", count: "87" },
        { name: "Concerts", count: "32" },
      ];
      const recent = [
        { title: "Dune : deuxième partie", meta: "2024 · Film", variant: 1 },
        { title: "Severance", meta: "S02 · Série", variant: 2 },
        { title: "The Bear", meta: "S03 · Série", variant: 3 },
        { title: "Perfect Days", meta: "2023 · Film", variant: 4 },
      ];

      return `
        ${pagehead({
          eyebrow: "Jellyfin · media-lab",
          title: "Le serveur média.",
          sub: "Bibliothèques, reprises et sessions actives. Les affiches restent derrière le proxy Martylab.",
          actions: `<button class="btn" data-toast="Ouverture de Jellyfin (démonstration)">${icon("external-link")} Ouvrir Jellyfin</button>`,
        })}

        <section class="panel panel--hero">
          <div class="resume">
            <div class="poster">
              <div class="poster__art poster__art--1"></div>
              <div class="poster__label"><b>Dune<br>Deuxième partie</b><span>2024 · 2 h 46</span></div>
            </div>
            <div>
              <div class="row" style="margin-bottom:6px">${badge("reprendre", "accent")}<span class="tiny">Film · 4K HDR</span></div>
              <div class="resume__title">Dune : deuxième partie</div>
              <div class="resume__sub">Denis Villeneuve · repris hier à 22:14 sur Salon TV</div>
              <div class="resume__bar">
                ${bar(42, "accent")}
                <div class="row row--between"><span>1 h 09 / 2 h 46</span><span>42 %</span></div>
              </div>
              <div class="row" style="margin-top:12px">
                <button class="btn btn--primary btn--sm" data-toast="Lecture lancée (démonstration)">${icon("play")} Reprendre</button>
                <button class="btn btn--sm" data-toast="Détails du média (démonstration)">${icon("file-text")} Détails</button>
              </div>
            </div>
          </div>
        </section>

        <div class="grid-3 section">
          <div class="panel" style="padding:13px 15px">${kpi("Bibliothèques", "8", "", "5 visibles pour ton compte")}</div>
          <div class="panel" style="padding:13px 15px">${kpi("À reprendre", "24", "", "dont 6 séries")}</div>
          <div class="panel" style="padding:13px 15px">${kpi("Sessions", "2", "actives", "Salon TV · Chambre")}</div>
        </div>

        <section class="section">
          <div class="section__head"><div class="section__title">${icon("library")} Bibliothèques</div><span class="panel__hint">8 au total</span></div>
          <div class="grid-5">
            ${libs.map((l) => `<div class="libchip">${icon("library")}<div class="grow"><b>${l.name}</b><span>${l.count} éléments</span></div></div>`).join("")}
          </div>
        </section>

        <section class="section">
          <div class="section__head"><div class="section__title">${icon("film")} Ajouts récents</div><button class="panel__link" data-toast="Tous les ajouts (démonstration)">Tout voir ${icon("arrow-right")}</button></div>
          <div class="posterrow">
            ${recent.map((r) => `
              <article class="poster" style="aspect-ratio:2/3">
                <div class="poster__art poster__art--${r.variant}"></div>
                <div class="poster__label"><b>${r.title}</b><span>${r.meta}</span></div>
              </article>`).join("")}
          </div>
        </section>

        <div class="grid-2 section">
          <section class="panel">
            <div class="panel__head"><span class="panel__title">${icon("monitor-play")} Lectures actives</span><span class="panel__hint">2 sessions</span></div>
            <div class="listrow">
              <span class="listrow__icon listrow__icon--accent">${icon("tv")}</span>
              <div class="listrow__body"><div class="listrow__title">Severance · S02E03</div><div class="listrow__sub">Salon TV · 34 min restantes</div></div>
              ${badge("lecture", "ok")}
            </div>
            <div class="listrow">
              <span class="listrow__icon">${icon("smartphone")}</span>
              <div class="listrow__body"><div class="listrow__title">The Bear · S03E01</div><div class="listrow__sub">Chambre · 18 min restantes</div></div>
              ${badge("pause", "")}
            </div>
          </section>

          <section class="panel">
            <div class="panel__head"><span class="panel__title">${icon("server")} Serveur</span><span class="panel__hint">media-lab</span></div>
            ${[
              ["Version", "10.10.3"],
              ["Système", "Debian 13"],
              ["Transcodage", "QuickSync · 0 actif"],
              ["Dernier scan", "il y a 12 min"],
            ].map((r) => `<div class="row row--between" style="padding:6px 0;border-top:1px solid var(--aura-line)"><span class="small muted">${r[0]}</span><span class="mono small">${r[1]}</span></div>`).join("")}
          </section>
        </div>
      `;
    },
  };

  /* ---------------------------------------------------------------------- */
  /* Services                                                                */
  /* ---------------------------------------------------------------------- */

  ML.pages.services = {
    title: "Services",
    render() {
      const stacks = ["martylab", "media", "home", "infra"];
      const groups = stacks.map((stack) => ({
        stack,
        items: ML.CONTAINERS.filter((c) => c.stack === stack),
      }));

      return `
        ${pagehead({
          eyebrow: "Docker · 4 stacks · 10 conteneurs",
          title: "Services",
          sub: "Démarrer, arrêter, redémarrer et lire les logs. Les invités restent en lecture seule côté serveur.",
          actions: `
            <button class="btn" data-toast="État Docker actualisé (démonstration)">${icon("refresh-cw")} Actualiser</button>
            <button class="btn btn--danger" data-toast="Redémarrage global : action sensible, confirmation requise.">${icon("rotate-ccw")} Tout redémarrer</button>`,
        })}

        <div class="grid-3" style="margin-bottom:14px">
          <div class="panel" style="padding:13px 15px">${kpi("En marche", "9", "/ 10", "1 conteneur arrêté")}</div>
          <div class="panel" style="padding:13px 15px">${kpi("Stacks", "4", "", "martylab · media · home · infra")}</div>
          <div class="panel" style="padding:13px 15px">${kpi("Dernière action", "23:40", "", "jellyfin redémarré par toi")}</div>
        </div>

        ${groups
          .map(
            (g) => `
          <div class="stackgroup">
            <div class="stackgroup__head">${icon("layers")}<span class="stackgroup__name">${g.stack}</span><span class="stackgroup__count">${g.items.length} services</span></div>
            ${g.items
              .map(
                (c) => `
              <div class="svcrow" data-svc="${c.name}">
                <div class="svcrow__name"><span class="dot ${c.state === "running" ? "dot--ok" : ""}"></span>${c.name}</div>
                <div class="svcrow__image">${c.image}</div>
                <div class="svcrow__uptime">${c.uptime}</div>
                <div class="rowactions">
                  <button class="iconbtn" data-svc-act="start" title="Démarrer" aria-label="Démarrer ${c.name}">${icon("play")}</button>
                  <button class="iconbtn" data-svc-act="restart" title="Redémarrer" aria-label="Redémarrer ${c.name}">${icon("rotate-ccw")}</button>
                  <button class="iconbtn" data-svc-act="stop" title="Arrêter" aria-label="Arrêter ${c.name}">${icon("square")}</button>
                  <button class="iconbtn" data-logs="${c.name}" title="Logs" aria-label="Logs ${c.name}">${icon("file-text")}</button>
                </div>
              </div>
              <div class="logs" data-logs-for="${c.name}" hidden>
                <pre><span class="dim">2026-11-11T09:41:02Z</span> <span class="ok">INFO</span>  ${c.name} | ready
<span class="dim">2026-11-11T09:41:03Z</span> <span class="ok">INFO</span>  ${c.name} | healthcheck ok
<span class="dim">2026-11-11T09:38:11Z</span> <span class="warn">WARN</span>  ${c.name} | latency above 50ms
<span class="dim">2026-11-11T09:30:00Z</span> <span class="ok">INFO</span>  ${c.name} | request handled in 38ms</pre>
              </div>`,
              )
              .join("")}
          </div>`,
          )
          .join("")}

        <p class="tiny" style="margin-top:12px">Les actions sont désactivées pour le rôle invité côté API, pas seulement dans l’interface.</p>
      `;
    },
  };

  /* ---------------------------------------------------------------------- */
  /* Paramètres                                                              */
  /* ---------------------------------------------------------------------- */

  ML.pages.settings = {
    title: "Paramètres",
    render() {
      const accents = [
        { id: "lime", color: "oklch(78% 0.17 138)", label: "Signal" },
        { id: "teal", color: "oklch(76% 0.12 195)", label: "Teal" },
        { id: "violet", color: "oklch(72% 0.16 300)", label: "Violet" },
        { id: "amber", color: "oklch(80% 0.16 72)", label: "Ambre" },
      ];

      return `
        ${pagehead({
          eyebrow: "Préférences · compte admin",
          title: "Paramètres",
          sub: "Apparence, installation mobile, notifications et compte. Les préférences sont locales à l’appareil.",
          actions: `<button class="btn btn--primary" data-toast="Préférences enregistrées (démonstration)">${icon("check")} Enregistrer</button>`,
        })}

        <div class="grid-2">
          <section class="panel">
            <div class="panel__head"><span class="panel__title">${icon("sun")} Apparence</span><span class="panel__hint">Local</span></div>

            <div class="settingrow">
              <div class="settingrow__body">
                <div class="settingrow__title">Thème</div>
                <div class="settingrow__sub">Le mode sombre est optimisé pour la supervision.</div>
              </div>
              <div class="themepick">
                <button data-theme-set="dark" aria-pressed="true">${icon("moon")} Sombre</button>
                <button data-theme-set="light" aria-pressed="false">${icon("sun")} Clair</button>
              </div>
            </div>

            <div class="settingrow">
              <div class="settingrow__body">
                <div class="settingrow__title">Accent</div>
                <div class="settingrow__sub">Un seul accent porte l’action et la donnée clé.</div>
              </div>
              <div class="accentpicker">
                ${accents
                  .map(
                    (a) => `<button class="accentchoice" style="background:${a.color}" data-accent-set="${a.id}" aria-label="${a.label}" aria-pressed="${a.id === "lime"}"></button>`,
                  )
                  .join("")}
              </div>
            </div>

            <div class="settingrow">
              <div class="settingrow__body">
                <div class="settingrow__title">Densité compacte</div>
                <div class="settingrow__sub">Réduit les espacements sur les grands écrans.</div>
              </div>
              <button class="switch" data-switch aria-checked="true" aria-label="Densité compacte"></button>
            </div>

            <div class="settingrow">
              <div class="settingrow__body">
                <div class="settingrow__title">Réduire les animations</div>
                <div class="settingrow__sub">Respecte aussi la préférence système.</div>
              </div>
              <button class="switch" data-switch aria-checked="false" aria-label="Réduire les animations"></button>
            </div>
          </section>

          <section class="panel">
            <div class="panel__head"><span class="panel__title">${icon("smartphone")} Application mobile</span>${badge("installée", "ok")}</div>
            <div class="listrow">
              <span class="listrow__icon listrow__icon--accent">${icon("smartphone")}</span>
              <div class="listrow__body">
                <div class="listrow__title">Martylab PWA</div>
                <div class="listrow__sub">v0.4.2 · écran d’accueil · mode hors ligne</div>
              </div>
              <button class="btn btn--sm" data-toast="Mise à jour de la PWA (démonstration)">${icon("download")} Mettre à jour</button>
            </div>
            <div class="settingrow" style="margin-top:4px">
              <div class="settingrow__body">
                <div class="settingrow__title">Bannière d’installation</div>
                <div class="settingrow__sub">Affichée une seule fois, jamais en overlay bloquant.</div>
              </div>
              <button class="switch" data-switch aria-checked="true" aria-label="Bannière d’installation"></button>
            </div>
          </section>

          <section class="panel">
            <div class="panel__head"><span class="panel__title">${icon("bell")} Notifications</span>${badge("push actif", "ok")}</div>
            <div class="settingrow">
              <div class="settingrow__body">
                <div class="settingrow__title">Alertes Orion</div>
                <div class="settingrow__sub">Porte ouverte, fuite, température anormale.</div>
              </div>
              <button class="switch" data-switch aria-checked="true" aria-label="Alertes Orion"></button>
            </div>
            <div class="settingrow">
              <div class="settingrow__body">
                <div class="settingrow__title">Rappels Matchday</div>
                <div class="settingrow__sub">30 minutes avant le coup d’envoi.</div>
              </div>
              <button class="switch" data-switch aria-checked="true" aria-label="Rappels Matchday"></button>
            </div>
            <div class="settingrow">
              <div class="settingrow__body">
                <div class="settingrow__title">Rapport hebdomadaire</div>
                <div class="settingrow__sub">Résumé du labo chaque lundi à 08:00.</div>
              </div>
              <button class="switch" data-switch aria-checked="false" aria-label="Rapport hebdomadaire"></button>
            </div>
            <div class="row" style="margin-top:10px">
              <button class="btn btn--sm" data-toast="Notification de test envoyée (démonstration)">${icon("send")} Envoyer un test</button>
              <span class="tiny">Clés VAPID configurées</span>
            </div>
          </section>

          <section class="panel">
            <div class="panel__head"><span class="panel__title">${icon("shield")} Compte & serveur</span></div>
            <div class="listrow">
              ${avatar("AL", "avatar--accent")}
              <div class="listrow__body">
                <div class="listrow__title">Alexandre</div>
                <div class="listrow__sub">alexandre · administrateur</div>
              </div>
              <button class="btn btn--sm" data-toast="Édition du profil (démonstration)">${icon("pencil")} Modifier</button>
            </div>
            <div class="settingrow">
              <div class="settingrow__body">
                <div class="settingrow__title">Mot de passe</div>
                <div class="settingrow__sub">Dernière modification il y a 42 jours.</div>
              </div>
              <button class="btn btn--sm" data-toast="Changement de mot de passe (démonstration)">${icon("key")} Changer</button>
            </div>
            <div class="hmr" style="height:1px;background:var(--aura-line);margin:4px 0"></div>
            <div class="row row--between" style="padding:6px 0"><span class="small muted">URL</span><span class="mono small">martylab.fr</span></div>
            <div class="row row--between" style="padding:6px 0"><span class="small muted">Version</span><span class="mono small">0.4.2 · 2026.11</span></div>
            <div class="row row--between" style="padding:6px 0"><span class="small muted">Sessions actives</span><span class="mono small">2 appareils</span></div>
          </section>
        </div>
      `;
    },
  };

  /* ---------------------------------------------------------------------- */
  /* Utilisateurs                                                            */
  /* ---------------------------------------------------------------------- */

  ML.pages.users = {
    title: "Utilisateurs",
    render() {
      const users = [
        { name: "Alexandre", id: "alexandre", initials: "AL", role: "admin", roleLabel: "Administrateur", last: "à l’instant", created: "12 janv. 2026", accent: true },
        { name: "Camille", id: "camille", initials: "CA", role: "user", roleLabel: "Utilisateur", last: "hier · 21:04", created: "03 mars 2026" },
        { name: "Invité", id: "guest", initials: "IN", role: "guest", roleLabel: "Invité", last: "il y a 3 j", created: "12 janv. 2026" },
      ];

      return `
        ${pagehead({
          eyebrow: "Administration · 3 comptes",
          title: "Utilisateurs",
          sub: "Les rôles sont appliqués côté serveur. Le dernier administrateur ne peut pas être supprimé.",
          actions: `<button class="btn btn--primary" data-open-invite>${icon("user-plus")} Inviter</button>`,
        })}

        <div class="grid-3" style="margin-bottom:14px">
          <div class="panel" style="padding:13px 15px">${kpi("Comptes", "3", "", "1 administrateur · 1 invité")}</div>
          <div class="panel" style="padding:13px 15px">${kpi("Actifs", "2", "/ 3", "connexion cette semaine")}</div>
          <div class="panel" style="padding:13px 15px">${kpi("Sessions", "4", "", "2 appareils pour toi")}</div>
        </div>

        <div class="split-8-4">
          <section class="panel panel--flush">
            <table class="tbl">
              <thead><tr><th>Utilisateur</th><th>Identifiant</th><th>Rôle</th><th>Dernière connexion</th><th></th></tr></thead>
              <tbody>
                ${users
                  .map(
                    (u) => `
                  <tr>
                    <td data-label="Utilisateur">
                      <div class="row">${avatar(u.initials, u.accent ? "avatar--accent" : "")}<div><div class="tbl__name">${u.name}</div><div class="tbl__sub">créé le ${u.created}</div></div></div>
                    </td>
                    <td data-label="Identifiant"><span class="userid">${u.id}</span></td>
                    <td data-label="Rôle"><span class="role role--${u.role}">${u.roleLabel}</span></td>
                    <td data-label="Dernière connexion"><span class="mono small">${u.last}</span></td>
                    <td data-label="">
                      <div class="rowactions">
                        <button class="iconbtn" data-toast="Édition de ${u.name} (démonstration)" aria-label="Modifier ${u.name}">${icon("pencil")}</button>
                        <button class="iconbtn" data-toast="Suppression impossible : ${u.name === "Alexandre" ? "dernier administrateur" : "action de démonstration"}." aria-label="Supprimer ${u.name}">${icon("trash-2")}</button>
                      </div>
                    </td>
                  </tr>`,
                  )
                  .join("")}
              </tbody>
            </table>
          </section>

          <aside class="panel">
            <div class="panel__head"><span class="panel__title">${icon("shield")} Permissions</span></div>
            ${[
              ["admin", "Tout gérer", "Utilisateurs, connecteurs, actions Docker."],
              ["user", "Agir", "Lancer des actions, pas gérer les comptes."],
              ["guest", "Consulter", "Lecture seule sur toutes les pages."],
            ]
              .map(
                (r) => `
              <div class="listrow">
                <span class="role role--${r[0]}">${r[0]}</span>
                <div class="listrow__body"><div class="listrow__title">${r[1]}</div><div class="listrow__sub">${r[2]}</div></div>
              </div>`,
              )
              .join("")}
            <div class="hr"></div>
            <p class="tiny" style="line-height:1.5">Le frontend masque les éléments non autorisés, mais l’API revérifie chaque requête.</p>
          </aside>
        </div>
      `;
    },
  };

  /* ---------------------------------------------------------------------- */
  /* Plugins (bientôt)                                                       */
  /* ---------------------------------------------------------------------- */

  ML.pages.plugins = {
    title: "Plugins",
    render() {
      return `
        ${pagehead({
          eyebrow: "Configuration · feuille de route",
          title: "Plugins",
          sub: "Une marketplace pour brancher de nouveaux services sans toucher au cœur de Martylab.",
          actions: badge("bientôt", "warn"),
        })}

        <div class="soon">
          <section class="soon__hero">
            <div class="soon__icon">${icon("puzzle")}</div>
            <h2>Une marketplace, pas un magasin de raccourcis.</h2>
            <p>Chaque plugin déclare ses capacités, son health check et ses permissions. Le registre actuel reste la source de vérité.</p>
            <div class="soon__actions">
              <button class="btn btn--primary" data-toast="Tu seras prévenu au lancement (démonstration)">${icon("bell")} Me prévenir</button>
              <button class="btn" data-nav="apps">${icon("blocks")} Voir le registre</button>
            </div>
          </section>

          <section class="panel">
            <div class="panel__head"><span class="panel__title">${icon("git-branch")} Prochaines étapes</span><span class="panel__hint">2026 — 2027</span></div>
            <div class="roadmap">
              <div class="roadmap__item">
                <span class="roadmap__dot roadmap__dot--now"></span>
                <div><div class="roadmap__title">Marketplace de plugins</div><div class="roadmap__sub">Installation, versionnage et permissions. En préparation.</div></div>
              </div>
              <div class="roadmap__item">
                <span class="roadmap__dot"></span>
                <div><div class="roadmap__title">Automatisations multi-plugins</div><div class="roadmap__sub">Scénarios « si Orion alors Jellyfin ». Q1 2027.</div></div>
              </div>
              <div class="roadmap__item">
                <span class="roadmap__dot"></span>
                <div><div class="roadmap__title">Journal d’activité</div><div class="roadmap__sub">Historique auditable des actions. Q2 2027.</div></div>
              </div>
            </div>
          </section>
        </div>

        <section class="section">
          <div class="section__head"><div class="section__title">${icon("blocks")} Déjà disponible</div><button class="panel__link" data-nav="apps">Ouvrir Applications ${icon("arrow-right")}</button></div>
          <div class="grid-4">
            ${["Orion", "Matchday", "Jellyfin", "Immich"].map((name, i) => `
              <button class="appcard" style="text-align:left" data-nav="apps">
                <div class="appcard__top"><span class="appcard__mark ${i === 0 ? "appcard__mark--accent" : ""}">${name.slice(0, 2).toUpperCase()}</span><div class="grow"><div class="appcard__name">${name}</div><div class="appcard__id">connecté</div></div>${badge("actif", "ok")}</div>
              </button>`).join("")}
          </div>
        </section>
      `;
    },
  };

  /* ---------------------------------------------------------------------- */
  /* Connexion                                                               */
  /* ---------------------------------------------------------------------- */

  ML.pages.login = {
    title: "Connexion",
    render() {
      return `
        <div class="login">
          <aside class="login__brand">
            <div class="login__grid"></div>
            <div class="login__brandtop">
              ${ML.mark()}
              <div><div class="login__brandname">Martylab</div><div class="login__brandsub">Personal lab</div></div>
            </div>
            <div class="login__pitch">
              <h2>Ton labo.<br>Sous <em>contrôle</em>.</h2>
              <p>Un seul point d’entrée pour tes applications, ton serveur et ta maison. Les services restent indépendants.</p>
            </div>
            <div class="login__status">
              <span><b>6</b> services en ligne</span>
              <span><b>99,98 %</b> uptime</span>
              <span><b>42 ms</b> latence API</span>
            </div>
          </aside>

          <div class="login__formside">
            <div class="login__form">
              ${ML.mark()}
              <h1>Connexion</h1>
              <p>Accède à ton laboratoire personnel.</p>
              <form data-login-form>
                <div class="field">
                  <label for="login-user">Identifiant</label>
                  <input class="input" id="login-user" value="alexandre" autocomplete="username">
                </div>
                <div class="field">
                  <label for="login-pass">Mot de passe</label>
                  <input class="input" id="login-pass" type="password" value="motdepasse" autocomplete="current-password">
                </div>
                <button class="btn btn--primary btn--block" type="submit">Se connecter ${icon("arrow-right")}</button>
              </form>
              <div class="login__foot"><span>Mot de passe oublié ?</span><span>v0.4.2</span></div>
              <div class="login__secure">${icon("shield")} Session chiffrée · cookie httpOnly · 7 jours</div>
            </div>
          </div>
        </div>
      `;
    },
  };

  /* ---------------------------------------------------------------------- */
  /* 404                                                                     */
  /* ---------------------------------------------------------------------- */

  ML.pages.notfound = {
    title: "Page 404",
    render() {
      return `
        <div class="nf">
          <div class="nf__code">404</div>
          <h1>Cette pièce n’existe pas dans le labo.</h1>
          <p>Le lien est peut-être obsolète, ou la page n’a pas encore été branchée.</p>
          <div class="row">
            <button class="btn btn--primary" data-nav="dashboard">${icon("arrow-right")} Retour au tableau de bord</button>
            <button class="btn" data-toast="Incident signalé (démonstration)">${icon("file-text")} Signaler</button>
          </div>
        </div>
      `;
    },
  };
})(window.ML);
