/* ==========================================================================
   Martylab — prototype « Cockpit »
   Écrans : Tableau de bord, Assistant, Applications, Système.
   ========================================================================== */

(function (ML) {
  const { icon, dot, badge, bar, spark, avatar, pagehead, kpi, APPS, SERVICES } = ML;

  /* ---------------------------------------------------------------------- */
  /* Tableau de bord                                                         */
  /* ---------------------------------------------------------------------- */

  ML.pages.dashboard = {
    title: "Tableau de bord",
    render() {
      const today = [
        { icon: "thermometer", title: "Maison", sub: "Salon · 21,4 °C", val: "12 lumières" },
        { icon: "trophy", title: "SCO – OM", sub: "Ce soir · 20:45", val: "Prono 2–1" },
        { icon: "play-circle", title: "Dune : deuxième partie", sub: "Jellyfin · 1 h 12 restantes", val: "42 %" },
      ];
      const activity = [
        { icon: "scan-line", title: "Jellyfin a indexé <b>12 nouveaux médias</b>", time: "09:41", kind: "ok" },
        { icon: "database", title: "Sauvegarde PostgreSQL terminée · <b>412 Mo</b>", time: "09:12", kind: "ok" },
        { icon: "sparkles", title: "Scène <b>« Réveil »</b> exécutée par Orion", time: "08:55", kind: "ok" },
        { icon: "cloud", title: "Tunnel Cloudflare : latence <b>62 ms</b>", time: "08:02", kind: "warn" },
        { icon: "rotate-ccw", title: "<b>jellyfin</b> redémarré par Alexandre", time: "Hier · 23:40", kind: "" },
      ];

      return `
        ${pagehead({
          eyebrow: `Mardi 11 novembre · 09:42`,
          title: "Bonjour Alexandre.",
          sub: "Tout tourne. Voici ce qui mérite ton attention aujourd’hui.",
          actions: `<button class="btn" data-toast="Métriques actualisées (démonstration)">${icon("refresh-cw")} Actualiser</button>`,
        })}

        <div class="grid-hero">
          <section class="panel panel--hero">
            <div class="hero__top">
              <div>
                <div class="eyebrow">Santé du labo</div>
                <div class="hero__score"><b>96</b><span>/ 100</span></div>
                <p class="hero__sub">7 services en ligne · dernier incident il y a 12 jours</p>
              </div>
              <span class="badge badge--ok">${dot("ok")} Opérationnel</span>
            </div>

            <div class="hero__metrics">
              <div class="metric">
                <div class="metric__head"><span class="metric__label">CPU</span><span class="metric__val">34<small>%</small></span></div>
                ${bar(34, "accent")}
                ${spark([28, 34, 30, 41, 36, 33, 29, 34, 38, 31, 34, 35], "accent")}
              </div>
              <div class="metric">
                <div class="metric__head"><span class="metric__label">RAM</span><span class="metric__val">62<small>%</small></span></div>
                ${bar(62)}
                ${spark([55, 57, 59, 58, 61, 63, 60, 62, 64, 61, 62, 62])}
              </div>
              <div class="metric">
                <div class="metric__head"><span class="metric__label">Disque</span><span class="metric__val">71<small>%</small></span></div>
                ${bar(71, "warn")}
                ${spark([66, 67, 67, 68, 68, 69, 69, 70, 70, 71, 71, 71], "warn")}
              </div>
            </div>

            <div class="hero__foot">
              <span>Uptime <b>42 j 06 h</b></span>
              <span>Temp. <b>48 °C</b></span>
              <span>Réseau <b>↓ 12,4</b> / <b>↑ 2,1 Mo/s</b></span>
              <span>Dernier backup <b>il y a 2 h</b></span>
            </div>
          </section>

          <aside class="panel">
            <div class="panel__head">
              <span class="panel__title">Aujourd’hui</span>
              <span class="today__day">mar. 11 nov.</span>
            </div>
            ${today
              .map(
                (item) => `
              <div class="today__item">
                <span class="today__icon">${icon(item.icon)}</span>
                <div class="grow">
                  <div class="today__title truncate">${item.title}</div>
                  <div class="today__sub truncate">${item.sub}</div>
                </div>
                <span class="today__val">${item.val}</span>
              </div>`,
              )
              .join("")}
          </aside>
        </div>

        <div class="cmdwrap">
          <form class="cmdbar" data-cmd-form>
            ${icon("sparkles")}
            <input data-cmd-input aria-label="Demander à Martylab" placeholder="Demander à Martylab — « allume la lumière du salon »">
            <span class="kbd">Ctrl</span><span class="kbd">K</span>
          </form>
          <div class="cmdchips">
            <button class="chip" data-prompt="Quelle est la température du salon ?">Température du salon</button>
            <button class="chip" data-prompt="Quel est le prochain match ?">Prochain match</button>
            <button class="chip" data-prompt="Montre-moi la charge du serveur.">Charge du serveur</button>
            <button class="chip" data-prompt="Quels médias ont été ajoutés à Jellyfin ?">Ajouts Jellyfin</button>
          </div>
        </div>

        <section class="section">
          <div class="section__head">
            <div class="section__title">${icon("activity")} Services</div>
            <button class="panel__link" data-nav="apps">Tout voir ${icon("arrow-right")}</button>
          </div>
          <div class="svc-grid">
            ${SERVICES.map(
              (s) => `
              <article class="svc">
                <div class="svc__top">
                  <span class="svc__icon">${icon(s.icon)}</span>
                  ${dot(s.status)}
                </div>
                <div>
                  <div class="svc__name">${s.name}</div>
                  <div class="svc__meta">${s.meta}</div>
                </div>
              </article>`,
            ).join("")}
          </div>
        </section>

        <div class="split-8-4 section">
          <section class="panel">
            <div class="panel__head">
              <span class="panel__title">${icon("history")} Activité récente</span>
              <button class="panel__link" data-nav="services">Journal ${icon("arrow-right")}</button>
            </div>
            ${activity
              .map(
                (a) => `
              <div class="feed__item">
                <span class="feed__icon">${icon(a.icon)}</span>
                <div class="feed__body">${a.title}</div>
                <div class="feed__time">${a.time}</div>
              </div>`,
              )
              .join("")}
          </section>

          <section class="panel">
            <div class="panel__head">
              <span class="panel__title">${icon("blocks")} Applications</span>
              <button class="panel__link" data-nav="apps">Registre ${icon("arrow-right")}</button>
            </div>
            ${APPS.slice(0, 4)
              .map(
                (app, i) => `
              <div class="appmini">
                <span class="appmini__mark ${i === 0 ? "appmini__mark--accent" : ""}">${app.name.slice(0, 2).toUpperCase()}</span>
                <div class="appmini__body">
                  <div class="appmini__name">${app.name}</div>
                  <div class="appmini__meta">v${app.version} · ${app.latency}</div>
                </div>
                ${badge("actif", "ok")}
              </div>`,
              )
              .join("")}
          </section>
        </div>
      `;
    },
  };

  /* ---------------------------------------------------------------------- */
  /* Assistant                                                               */
  /* ---------------------------------------------------------------------- */

  ML.pages.assistant = {
    title: "Assistant",
    render() {
      const convs = [
        { title: "Routine du soir", icon: "message-square", active: true },
        { title: "Température du labo", icon: "thermometer" },
        { title: "Résumé Matchday", icon: "trophy" },
        { title: "Ajouts Jellyfin", icon: "tv" },
        { title: "Diagnostic sauvegarde", icon: "database" },
      ];

      return `
        ${pagehead({
          eyebrow: "Assistant · 3 conversations",
          title: "Que fait-on maintenant ?",
          sub: "Des outils explicites, des permissions par rôle, et une confirmation avant toute action sensible.",
          actions: `<button class="btn" data-toast="Nouvelle conversation créée (démonstration)">${icon("plus")} Nouvelle conversation</button>`,
        })}

        <div class="assistant">
          <aside class="panel convlist">
            <div class="panel__head panel__head--tight">
              <span class="panel__title">${icon("list")} Conversations</span>
              <span class="panel__hint">3 j</span>
            </div>
            <div class="convlist__scroll">
              ${convs
                .map(
                  (c) => `
                <button class="conv ${c.active ? "is-active" : ""}" data-toast="Conversation « ${c.title} » (démonstration)">
                  ${icon(c.icon)}<span>${c.title}</span>
                </button>`,
                )
                .join("")}
            </div>
            <div class="hr"></div>
            <div class="tiny" style="letter-spacing:.12em;text-transform:uppercase;margin-bottom:6px">Contexte actif</div>
            <div class="chips">
              <span class="chip chip--static">${icon("sparkles")} Orion</span>
              <span class="chip chip--static">${icon("tv")} Jellyfin</span>
              <span class="chip chip--static">${icon("trophy")} Matchday</span>
            </div>
          </aside>

          <section class="panel chat" data-chat>
            <header class="chat__head">
              <div>
                <div class="chat__title">Routine du soir</div>
                <div class="chat__meta">4 messages · contexte Orion, Jellyfin</div>
              </div>
              <div class="chat__ctx">
                ${badge("lecture + action", "accent")}
                ${badge("confirmation requise", "warn")}
              </div>
            </header>

            <div class="chat__body" data-chat-body>
              <div class="msgline">
                <span class="msgline__avatar">${icon("bot")}</span>
                <div class="bubble">
                  Bonsoir Alexandre. Le serveur est calme : CPU à <b>18 %</b> et la sauvegarde de 23 h 00 est terminée. Tu veux que je prépare la routine du soir ?
                  <span class="bubble__time">21:04</span>
                </div>
              </div>

              <div class="msgline msgline--user">
                <span class="msgline__avatar">AL</span>
                <div class="bubble">Oui. Coupe les lumières du salon et lance le mode nuit.</div>
              </div>

              <div class="msgline">
                <span class="msgline__avatar">${icon("bot")}</span>
                <div class="bubble">
                  J’ai vérifié Orion : <b>3 lumières</b> sont encore allumées.
                  <div class="tool" style="margin-top:7px">${icon("check")} <b>orion.get_home_state</b> <span class="tool__res">14 ms</span></div>
                  <span class="bubble__time">21:04</span>
                </div>
              </div>

              <div class="msgline">
                <span class="msgline__avatar">${icon("bot")}</span>
                <div class="bubble">
                  Je peux éteindre le salon et la cuisine, puis lancer la scène <b>Nuit</b>. Cette action modifiera 5 appareils.
                  <span class="bubble__time">21:05</span>
                </div>
              </div>

              <div class="confirm" data-confirm>
                <div class="confirm__title">${icon("triangle-alert")} Action à confirmer</div>
                <div class="confirm__body">Éteindre 3 lumières · lancer la scène « Nuit » · baisser les volets du salon.</div>
                <div class="confirm__actions">
                  <button class="btn btn--primary btn--sm" data-confirm-yes>Confirmer</button>
                  <button class="btn btn--sm" data-confirm-no>Annuler</button>
                </div>
              </div>
            </div>

            <div class="composer">
              <form data-chat-form>
                <div class="composer__box">
                  <textarea rows="1" data-chat-input placeholder="Écris à Martylab…"></textarea>
                  <button class="btn btn--primary btn--icon btn--sm" type="submit" aria-label="Envoyer">${icon("send")}</button>
                </div>
                <div class="composer__hint">
                  <span>Entrée pour envoyer · Maj+Entrée pour une nouvelle ligne</span>
                  <span>Outils : Orion · Jellyfin · Matchday</span>
                </div>
              </form>
            </div>
          </section>
        </div>
      `;
    },
  };

  /* ---------------------------------------------------------------------- */
  /* Applications                                                            */
  /* ---------------------------------------------------------------------- */

  ML.pages.apps = {
    title: "Applications",
    render() {
      return `
        ${pagehead({
          eyebrow: "Registre · 7 entrées",
          title: "Applications",
          sub: "Chaque application reste indépendante. Martylab ne parle que par API, jamais par sa base de données.",
          actions: `
            <button class="btn" data-toast="Registre actualisé (démonstration)">${icon("refresh-cw")} Actualiser</button>
            <button class="btn btn--primary" data-toast="Assistant d’ajout de connecteur (démonstration)">${icon("plus")} Ajouter</button>`,
        })}

        <div class="grid-3 apps-stats" style="margin-bottom:14px">
          <div class="panel" style="padding:13px 15px">${kpi("Connectées", "6", "/ 7", "1 connecteur en pause")}</div>
          <div class="panel" style="padding:13px 15px">${kpi("Capacités", "11", "", "dashboard · actions · health")}</div>
          <div class="panel" style="padding:13px 15px">${kpi("Dernier scan", "09:41", "", "il y a 1 minute")}</div>
        </div>

        <div class="filterbar">
          <label class="search">${icon("search")}<input data-app-search placeholder="Rechercher une application…"></label>
          <div class="chips">
            <button class="chip is-active" data-app-filter="all" aria-pressed="true">Toutes</button>
            <button class="chip" data-app-filter="active" aria-pressed="false">Actives</button>
            <button class="chip" data-app-filter="inactive" aria-pressed="false">Inactives</button>
          </div>
          <span class="filterbar__spacer"></span>
          <button class="iconbtn" data-toast="Affichage liste (démonstration)" aria-label="Vue liste">${icon("list")}</button>
        </div>

        <div class="apps-grid" data-apps-grid>
          ${APPS.map(
            (app, i) => `
            <article class="appcard" data-app data-name="${app.name.toLowerCase()} ${app.id}" data-enabled="${app.enabled}">
              <div class="appcard__top">
                <span class="appcard__mark ${i === 0 ? "appcard__mark--accent" : ""}">${app.name.slice(0, 2).toUpperCase()}</span>
                <div class="grow">
                  <div class="appcard__name">${app.name}</div>
                  <div class="appcard__id">${app.id} · v${app.version}</div>
                </div>
                ${app.enabled ? badge("actif", "ok") : badge("pause", "")}
              </div>
              <p class="appcard__desc">${app.desc}</p>
              <div class="appcard__foot">
                <div class="appcard__caps">
                  ${app.caps.slice(0, 3).map((c) => `<span class="cap">${c}</span>`).join("")}
                  ${app.caps.length > 3 ? `<span class="cap">+${app.caps.length - 3}</span>` : ""}
                </div>
                <span class="tiny">${app.latency} ${icon("arrow-up-right")}</span>
              </div>
            </article>`,
          ).join("")}
        </div>
      `;
    },
  };

})(window.ML);
