/* ==========================================================================
   Martylab — prototype « Cockpit »
   Shell applicatif, navigation, overlays et micro-interactions.
   ========================================================================== */

(function (ML) {
  const { icon, mark, dot, badge, avatar } = ML;
  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));

  const NOTES = {
    dashboard: "Un héro unique (santé), une barre de commande, puis les services. Fini l’empilement de cartes.",
    assistant: "Le chat devient un vrai espace de travail : contexte visible, outils tracés, confirmation inline.",
    matchday: "Le prochain match est le héro, le pronostic est l’action primaire, le reste est secondaire.",
    photos: "Les albums redeviennent des images, pas des cartes de statistiques. Instances séparées.",
    jellyfin: "Une reprise en cours en héro, puis les bibliothèques et les sessions.",
    system: "Une console d’instrumentation complète : santé, réseau, stockage, processus, matériel et journal.",
    services: "Les conteneurs sont groupés par stack, avec actions et logs au même endroit.",
    console: "Une console allowlistée, tracée et sans shell libre. Les commandes à risque demandent une confirmation.",
    apps: "Le registre devient un annuaire scannable : état, latence, capacités.",
    settings: "Des réglages en lignes, pas des cartes imbriquées. Thème et accent sont réellement prévisualisés.",
    users: "Rôles et permissions visibles côte à côte, actions secondaires discrètes.",
    plugins: "Un état « bientôt » assumé, avec une feuille de route lisible.",
    login: "Une entrée de produit, pas un formulaire perdu au milieu du vide.",
    notfound: "Une erreur calme, cohérente avec le reste du système.",
  };

  const state = {
    page: "dashboard",
    view: "desktop",
    theme: "dark",
    accent: "lime",
    appFilter: "all",
    pendingPrompt: "",
    consoleIndex: -1,
  };

  let device;
  let app;
  let view;
  let sidebar;
  let topbar;
  let mappbar;
  let tabbar;

  /* ---------------------------------------------------------------------- */
  /* Shell                                                                   */
  /* ---------------------------------------------------------------------- */

  function navCount(id) {
    if (id === "services") return "10";
    if (id === "apps") return "7";
    if (id === "users") return "3";
    return "";
  }

  function renderSidebar() {
    const groups = ML.NAV.map((group) => {
      const items = group.ids.map((id) => ML.byId(id)).filter(Boolean);
      return `
        <div class="nav__label">${group.label}</div>
        ${items
          .map(
            (item) => `
          <button class="nav__item ${state.page === item.id ? "is-active" : ""}" data-nav="${item.id}">
            ${icon(item.icon)}
            <span class="grow truncate">${item.label}</span>
            ${item.soon ? `<span class="nav__soon" title="Bientôt"></span>` : navCount(item.id) ? `<span class="nav__count">${navCount(item.id)}</span>` : ""}
          </button>`,
          )
          .join("")}
      `;
    }).join("");

    sidebar.innerHTML = `
      <div class="brand">
        <button class="row" data-nav="dashboard" style="border:0;background:transparent;padding:0;gap:10px;text-align:left">
          ${mark()}
          <span class="brand__txt">
            <span class="brand__name">Martylab</span>
            <span class="brand__sub">Personal lab</span>
          </span>
        </button>
      </div>

      <nav class="nav" aria-label="Navigation principale">${groups}</nav>

      <div class="sidefoot">
        <div class="sidefoot__status">${dot("ok")} Tout est opérationnel <span class="num">6 / 7</span></div>
        <button class="userchip" data-toast="Menu du compte (démonstration)">
          ${avatar("AL", "avatar--sm")}
          <span class="userchip__txt">
            <span class="userchip__name">Alexandre</span>
            <span class="userchip__role">Admin</span>
          </span>
          ${icon("chevron-down")}
        </button>
      </div>
    `;
  }

  function renderTopbar() {
    topbar.innerHTML = `
      <button class="searchbtn" data-palette>
        ${icon("search")}
        <span>Rechercher ou commander…</span>
        <span class="kbd">Ctrl</span><span class="kbd">K</span>
      </button>

      <div class="topbar__right">
        <span class="statuspill">${dot("ok")} Opérationnel ${icon("chevron-down")}</span>
        <button class="iconbtn" data-notif aria-label="Notifications">
          ${icon("bell")}<span class="iconbtn__dot"></span>
        </button>
        <button class="iconbtn" data-theme-toggle aria-label="Changer de thème">${icon(state.theme === "dark" ? "sun" : "moon")}</button>
        <button class="iconbtn" data-toast="Menu du compte (démonstration)" aria-label="Compte">
          ${avatar("AL")}
        </button>
      </div>
    `;
  }

  function renderMappbar() {
    const meta = ML.byId(state.page);
    mappbar.innerHTML = `
      <button class="row" data-nav="dashboard" style="border:0;background:transparent;padding:0;gap:7px">
        ${mark()}
        <span class="mappbar__title">${meta ? meta.label : "Martylab"}</span>
      </button>
      <div class="mappbar__right">
        <button class="iconbtn" data-notif aria-label="Notifications">${icon("bell")}<span class="iconbtn__dot"></span></button>
        <button class="iconbtn" data-toast="Menu du compte (démonstration)" aria-label="Compte">${avatar("AL", "avatar--sm")}</button>
      </div>
    `;
  }

  function renderTabbar() {
    const tabs = [
      { id: "dashboard", label: "Accueil", icon: "layout-dashboard" },
      { id: "apps", label: "Apps", icon: "blocks" },
      { id: "assistant", label: "Assistant", icon: "bot", cta: true },
      { id: "system", label: "Système", icon: "server" },
      { id: "__more", label: "Plus", icon: "more-horizontal" },
    ];

    tabbar.innerHTML = tabs
      .map((tab) => {
        const active = state.page === tab.id;
        const action = tab.id === "__more" ? `data-more` : `data-nav="${tab.id}"`;
        return `<button class="tab ${tab.cta ? "tab--cta" : ""}" ${action} ${active ? 'aria-current="true"' : ""}>
          ${icon(tab.icon)}<span>${tab.label}</span>
        </button>`;
      })
      .join("");
  }

  function renderStudioIndex() {
    const index = $("#studio-index");
    const groups = ["Pilotage", "Infrastructure", "Univers", "Configuration", "États"];
    index.innerHTML = groups
      .map((group) => {
        const pages = ML.PAGES.filter((p) => p.group === group);
        return `
          <h2>${group}</h2>
          ${pages
            .map((p, i) => {
              const n = String(ML.PAGES.indexOf(p) + 1).padStart(2, "0");
              return `<button data-page="${p.id}" ${state.page === p.id ? 'aria-current="true"' : ""}>
                ${icon(p.icon)}<span>${p.label}</span><span class="n">${n}</span>
              </button>`;
            })
            .join("")}
        `;
      })
      .join("");
  }

  function updateChrome() {
    const meta = ML.byId(state.page);
    app.classList.toggle("is-bare", !meta.inApp);
    $$(".nav__item", sidebar).forEach((el) => {
      el.classList.toggle("is-active", el.dataset.nav === state.page);
    });
    $$(".tab", tabbar).forEach((el) => {
      const active = el.dataset.nav === state.page;
      if (active) el.setAttribute("aria-current", "true");
      else el.removeAttribute("aria-current");
    });
    $$("#studio-index [data-page]").forEach((el) => {
      if (el.dataset.page === state.page) el.setAttribute("aria-current", "true");
      else el.removeAttribute("aria-current");
    });
    mappbar.querySelector(".mappbar__title").textContent = meta ? meta.label : "Martylab";
    document.title = `${meta ? meta.label : "Martylab"} · Martylab — Cockpit`;
    $("#stage-title").textContent = meta ? meta.label : "Martylab";
    $("#stage-note").innerHTML = NOTES[state.page] || "";
  }

  function renderPage() {
    const meta = ML.byId(state.page);
    const page = ML.pages[state.page];
    if (!page) return;

    view.innerHTML = meta.inApp
      ? `<div class="content">${page.render()}</div>`
      : page.render();

    view.scrollTop = 0;
    updateChrome();
    bindPage();

    if (state.pendingPrompt) {
      const input = $("[data-chat-input]", view);
      if (input) {
        input.value = state.pendingPrompt;
        input.focus();
      }
      state.pendingPrompt = "";
    }
  }

  function go(id) {
    if (!ML.pages[id]) return;
    state.page = id;
    try {
      history.replaceState(null, "", `#${id}`);
    } catch (error) {
      /* file:// peut refuser replaceState ; la navigation reste fonctionnelle. */
    }
    renderPage();
  }

  /* ---------------------------------------------------------------------- */
  /* Thème & accent                                                          */
  /* ---------------------------------------------------------------------- */

  function setTheme(theme) {
    state.theme = theme;
    device.dataset.theme = theme;
    $$("[data-theme]").forEach((el) => {
      if (el.closest(".studio__bar")) el.setAttribute("aria-pressed", String(el.dataset.theme === theme));
    });
    $$("[data-theme-set]").forEach((el) => el.setAttribute("aria-pressed", String(el.dataset.themeSet === theme)));
    const toggle = $("[data-theme-toggle]", topbar);
    if (toggle) toggle.innerHTML = icon(theme === "dark" ? "sun" : "moon");
  }

  function setAccent(accent) {
    state.accent = accent;
    device.dataset.accent = accent;
    $$("[data-swatch]").forEach((el) => el.setAttribute("aria-pressed", String(el.dataset.swatch === accent)));
    $$("[data-accent-set]").forEach((el) => el.setAttribute("aria-pressed", String(el.dataset.accentSet === accent)));
  }

  function setView(viewMode) {
    state.view = viewMode;
    device.classList.toggle("device--desktop", viewMode === "desktop");
    device.classList.toggle("device--mobile", viewMode === "mobile");
    $$("[data-view]").forEach((el) => el.setAttribute("aria-pressed", String(el.dataset.view === viewMode)));
    renderPage();
  }

  /* ---------------------------------------------------------------------- */
  /* Overlays                                                                */
  /* ---------------------------------------------------------------------- */

  function closeOverlays() {
    $$("[data-overlay]", device).forEach((el) => el.remove());
  }

  function toast(message) {
    const existing = $(".toast", device);
    if (existing) existing.remove();
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `${icon("check")}<span>${message}</span>`;
    device.appendChild(el);
    window.setTimeout(() => el.remove(), 2600);
  }

  function overlay(inner, kind) {
    const scrim = document.createElement("div");
    scrim.className = "scrim";
    scrim.dataset.overlay = kind;
    scrim.innerHTML = inner;
    device.appendChild(scrim);
    return scrim;
  }

  function openPalette() {
    closeOverlays();
    const scrim = overlay(
      `<div class="palette" role="dialog" aria-label="Recherche">
        <div class="palette__input">${icon("search")}<input data-palette-input placeholder="Rechercher une page, un service…" autocomplete="off"></div>
        <div class="palette__list" data-palette-list></div>
        <div class="palette__foot"><span>Entrée pour ouvrir</span><span>Échap pour fermer</span><span>Ctrl K</span></div>
      </div>`,
      "palette",
    );

    const input = $("[data-palette-input]", scrim);
    const list = $("[data-palette-list]", scrim);

    const draw = (query) => {
      const q = query.trim().toLowerCase();
      const results = ML.PAGES.filter((p) => !q || p.label.toLowerCase().includes(q) || p.group.toLowerCase().includes(q));
      list.innerHTML = results.length
        ? results
            .map(
              (p) => `<button class="palette__item ${p.id === results[0].id ? "is-active" : ""}" data-palette-item="${p.id}">
                ${icon(p.icon)}<span>${p.label}</span><span class="n">${p.group}</span>
              </button>`,
            )
            .join("")
        : `<div class="empty">Aucun résultat.</div>`;
    };

    draw("");
    input.addEventListener("input", () => draw(input.value));
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        const first = $("[data-palette-item]", list);
        if (first) {
          closeOverlays();
          go(first.dataset.paletteItem);
        }
      }
    });
    window.setTimeout(() => input.focus(), 30);
  }

  function openMore() {
    closeOverlays();
    const items = ML.PAGES.filter((p) => p.inApp && !["dashboard", "apps", "assistant", "system"].includes(p.id));
    overlay(
      `<div class="sheet" role="dialog" aria-label="Plus de pages">
        <div class="sheet__handle"></div>
        <div class="sheet__title">Plus</div>
        <div class="sheet__grid">
          ${items
            .map(
              (p) => `<button class="sheet__item" data-nav="${p.id}">${icon(p.icon)}<span>${p.label}</span></button>`,
            )
            .join("")}
        </div>
        <div class="hr"></div>
        <button class="btn btn--ghost btn--block" data-toast="Déconnexion (démonstration)">${icon("log-out")} Se déconnecter</button>
      </div>`,
      "sheet",
    );
  }

  function openNotifications() {
    const existing = $("[data-popover]", device);
    if (existing) {
      existing.remove();
      return;
    }
    closeOverlays();
    const pop = document.createElement("div");
    pop.className = "popover";
    pop.dataset.popover = "notifications";
    pop.innerHTML = `
      <div class="popover__head"><span class="panel__title">${icon("bell")} Notifications</span><span class="tiny">3 non lues</span></div>
      ${[
        { icon: "triangle-alert", title: "Cloudflare : latence 62 ms", time: "il y a 12 min", kind: "warn" },
        { icon: "circle-check", title: "Sauvegarde PostgreSQL terminée", time: "il y a 30 min", kind: "ok" },
        { icon: "trophy", title: "SCO – OM dans 3 h", time: "il y a 1 h", kind: "" },
      ]
        .map(
          (n) => `<div class="notif">
            <span class="notif__icon">${icon(n.icon)}</span>
            <div class="grow"><div class="notif__title">${n.title}</div><div class="notif__time">${n.time}</div></div>
            ${n.kind ? dot(n.kind) : ""}
          </div>`,
        )
        .join("")}
      <button class="btn btn--ghost btn--block btn--sm" data-toast="Tout est marqué comme lu (démonstration)">Tout marquer comme lu</button>
    `;
    device.appendChild(pop);
  }

  function openInvite() {
    closeOverlays();
    const scrim = overlay(
      `<form class="modal" data-invite-form>
        <h2 class="modal__title">Inviter un utilisateur</h2>
        <p class="modal__sub">Le compte reçoit un mot de passe temporaire à changer à la première connexion.</p>
        <div class="field"><label>Nom affiché</label><input class="input" placeholder="Camille" required></div>
        <div class="field" style="margin-top:10px"><label>Identifiant</label><input class="input" placeholder="camille" required></div>
        <div class="field" style="margin-top:10px"><label>Rôle</label>
          <select class="select"><option>Utilisateur</option><option>Invité</option><option>Administrateur</option></select>
        </div>
        <div class="modal__foot">
          <button type="button" class="btn" data-close>Annuler</button>
          <button type="submit" class="btn btn--primary">${icon("user-plus")} Envoyer l’invitation</button>
        </div>
      </form>`,
      "modal",
    );
    const first = $("input", scrim);
    window.setTimeout(() => first && first.focus(), 40);
  }

  /* ---------------------------------------------------------------------- */
  /* Interactions de page                                                    */
  /* ---------------------------------------------------------------------- */

  function filterApps() {
    const input = $("[data-app-search]", view);
    const q = (input ? input.value : "").trim().toLowerCase();
    $$("[data-app]", view).forEach((card) => {
      const matchesQuery = !q || card.dataset.name.includes(q);
      const matchesStatus =
        state.appFilter === "all" ||
        (state.appFilter === "active" && card.dataset.enabled === "true") ||
        (state.appFilter === "inactive" && card.dataset.enabled === "false");
      card.hidden = !(matchesQuery && matchesStatus);
    });
  }

  function sendChat(text) {
    const body = $("[data-chat-body]", view);
    if (!body || !text.trim()) return;
    const safe = text.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]);

    body.insertAdjacentHTML(
      "beforeend",
      `<div class="msgline msgline--user">
        <span class="msgline__avatar">AL</span>
        <div class="bubble">${safe}<span class="bubble__time">maintenant</span></div>
      </div>
      <div class="typing" data-typing><i></i><i></i><i></i> Martylab consulte les outils…</div>`,
    );
    body.scrollTop = body.scrollHeight;

    window.setTimeout(() => {
      const typing = $("[data-typing]", body);
      if (typing) typing.remove();
      body.insertAdjacentHTML(
        "beforeend",
        `<div class="msgline">
          <span class="msgline__avatar">${icon("bot")}</span>
          <div class="bubble">
            En mode démonstration, je ne peux pas exécuter cette action. En production, je vérifie d’abord les permissions de ton rôle, puis je demande une confirmation si l’action est sensible.
            <div class="tool" style="margin-top:7px">${icon("check")} <b>permissions.check</b> <span class="tool__res">3 ms</span></div>
            <span class="bubble__time">maintenant</span>
          </div>
        </div>`,
      );
      body.scrollTop = body.scrollHeight;
    }, 700);
  }

  function sysTab(id) {
    $$("[data-sys-tab]", view).forEach((el) => {
      const on = el.dataset.sysTab === id;
      el.classList.toggle("is-active", on);
      el.setAttribute("aria-selected", String(on));
    });
    $$("[data-sys-panel]", view).forEach((panel) => {
      panel.hidden = panel.dataset.sysPanel !== id;
    });
  }

  function filterLogs() {
    const active = $("[data-log-filter].is-active", view);
    const kind = active ? active.dataset.logFilter : "all";
    const search = $("[data-log-search]", view);
    const query = (search ? search.value : "").trim().toLowerCase();

    $$("[data-log-item]", view).forEach((row) => {
      const unit = row.dataset.logUnit || "";
      const matchesKind =
        kind === "all" ||
        (kind === "systemd" && unit === "systemd") ||
        (kind === "docker" && /docker|jellyfin|immich/.test(unit)) ||
        row.dataset.logKind === kind;
      const matchesQuery = !query || row.textContent.toLowerCase().includes(query);
      row.hidden = !(matchesKind && matchesQuery);
    });
  }

  function appendAudit(command, status) {
    const body = $("[data-audit-body]", view);
    if (!body) return;
    const time = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const kind = status === "ok" ? "ok" : status === "refusé" ? "danger" : "warn";
    const safe = String(command).replace(/[<>&"]/g, "");
    body.insertAdjacentHTML(
      "afterbegin",
      `<tr>
        <td data-label="Heure"><span class="mono small">${time}</span></td>
        <td data-label="Utilisateur"><span class="small">alexandre</span></td>
        <td data-label="Commande"><span class="mono small">${safe}</span></td>
        <td data-label="Résultat">${badge(status, kind)}</td>
        <td data-label="Durée"><span class="mono small">${status === "refusé" ? "—" : "12 ms"}</span></td>
      </tr>`,
    );
  }

  function consolePrint(html) {
    const body = $("[data-console-out]", view);
    if (!body) return;
    body.insertAdjacentHTML("beforeend", html);
    body.scrollTop = body.scrollHeight;
  }

  function runConsole(raw) {
    const command = String(raw || "").trim();
    if (!command || !ML.console) return;

    state.consoleIndex = -1;
    const result = ML.console.run(command);
    if (result.clear) {
      const body = $("[data-console-out]", view);
      if (body) body.innerHTML = "";
      return;
    }

    let html = "";
    if (result.echo) {
      html += ML.console.promptHTML(command) + result.lines.map(ML.console.lineHTML).join("");
    }
    if (result.confirm) {
      html += `<div class="term__confirm" data-term-confirm="${result.confirm.command}">
        ${icon("triangle-alert")}<span>${result.confirm.reason}</span><span class="grow"></span>
        <button class="btn btn--primary" data-console-confirm>Confirmer</button>
        <button class="btn" data-console-cancel>Annuler</button>
      </div>`;
    }
    consolePrint(html);

    const refused = result.lines.some((line) => line.cls === "danger" && line.text.startsWith("refusé"));
    if (result.confirm) appendAudit(command, "en attente");
    else appendAudit(command, refused ? "refusé" : "ok");
  }

  function bindPage() {
    if (state.page === "apps") {
      filterApps();
    }

    const loginForm = $("[data-login-form]", view);
    if (loginForm) {
      loginForm.addEventListener("submit", (event) => {
        event.preventDefault();
        toast("Connexion simulée — bienvenue Alexandre.");
        window.setTimeout(() => go("dashboard"), 550);
      });
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Événements                                                              */
  /* ---------------------------------------------------------------------- */

  function onDocumentClick(event) {
    const target = event.target;

    const nav = target.closest("[data-nav]");
    if (nav) {
      closeOverlays();
      go(nav.dataset.nav);
      return;
    }

    const page = target.closest("[data-page]");
    if (page) {
      go(page.dataset.page);
      return;
    }

    const viewButton = target.closest("[data-view]");
    if (viewButton) {
      setView(viewButton.dataset.view);
      return;
    }

    const themeButton = target.closest("[data-theme]");
    if (themeButton && themeButton.closest(".studio__bar")) {
      setTheme(themeButton.dataset.theme);
      return;
    }

    const themeSet = target.closest("[data-theme-set]");
    if (themeSet) {
      setTheme(themeSet.dataset.themeSet);
      return;
    }

    const swatch = target.closest("[data-swatch]");
    if (swatch) {
      setAccent(swatch.dataset.swatch);
      return;
    }

    const accentSet = target.closest("[data-accent-set]");
    if (accentSet) {
      setAccent(accentSet.dataset.accentSet);
      return;
    }

    const themeToggle = target.closest("[data-theme-toggle]");
    if (themeToggle) {
      setTheme(state.theme === "dark" ? "light" : "dark");
      return;
    }

    const switchEl = target.closest("[data-switch]");
    if (switchEl) {
      switchEl.setAttribute("aria-checked", switchEl.getAttribute("aria-checked") === "true" ? "false" : "true");
      return;
    }

    const palette = target.closest("[data-palette]");
    if (palette) {
      openPalette();
      return;
    }

    const paletteItem = target.closest("[data-palette-item]");
    if (paletteItem) {
      closeOverlays();
      go(paletteItem.dataset.paletteItem);
      return;
    }

    const more = target.closest("[data-more]");
    if (more) {
      openMore();
      return;
    }

    const notif = target.closest("[data-notif]");
    if (notif) {
      openNotifications();
      return;
    }

    const openInviteBtn = target.closest("[data-open-invite]");
    if (openInviteBtn) {
      openInvite();
      return;
    }

    const close = target.closest("[data-close]");
    if (close) {
      closeOverlays();
      return;
    }

    const prompt = target.closest("[data-prompt]");
    if (prompt) {
      state.pendingPrompt = prompt.dataset.prompt;
      go("assistant");
      return;
    }

    const filter = target.closest("[data-app-filter]");
    if (filter) {
      state.appFilter = filter.dataset.appFilter;
      $$("[data-app-filter]", view).forEach((el) => {
        el.classList.toggle("is-active", el === filter);
        el.setAttribute("aria-pressed", String(el === filter));
      });
      filterApps();
      return;
    }

    const logs = target.closest("[data-logs]");
    if (logs) {
      const name = logs.dataset.logs;
      const drawer = $(`[data-logs-for="${name}"]`, view);
      if (drawer) drawer.hidden = !drawer.hidden;
      return;
    }

    const sysTabBtn = target.closest("[data-sys-tab]");
    if (sysTabBtn) {
      sysTab(sysTabBtn.dataset.sysTab);
      return;
    }

    const logFilter = target.closest("[data-log-filter]");
    if (logFilter) {
      $$("[data-log-filter]", view).forEach((el) => {
        el.classList.toggle("is-active", el === logFilter);
        el.setAttribute("aria-pressed", String(el === logFilter));
      });
      filterLogs();
      return;
    }

    const consoleCmd = target.closest("[data-console-cmd]");
    if (consoleCmd) {
      runConsole(consoleCmd.dataset.consoleCmd);
      const input = $("[data-console-input]", view);
      if (input) input.value = "";
      return;
    }

    const consoleClear = target.closest("[data-console-clear]");
    if (consoleClear) {
      const body = $("[data-console-out]", view);
      if (body) body.innerHTML = "";
      return;
    }

    const consoleConfirm = target.closest("[data-console-confirm]");
    if (consoleConfirm) {
      const card = consoleConfirm.closest("[data-term-confirm]");
      const command = card ? card.dataset.termConfirm : "";
      if (card) card.remove();
      consolePrint(ML.console.confirm(command).map(ML.console.lineHTML).join(""));
      appendAudit(command, "confirmé");
      toast("Action exécutée et journalisée (démonstration).");
      return;
    }

    const consoleCancel = target.closest("[data-console-cancel]");
    if (consoleCancel) {
      const card = consoleCancel.closest("[data-term-confirm]");
      const command = card ? card.dataset.termConfirm : "";
      if (card) card.remove();
      consolePrint(ML.console.cancel(command).map(ML.console.lineHTML).join(""));
      return;
    }

    const svcAct = target.closest("[data-svc-act]");
    if (svcAct) {
      const row = svcAct.closest(".svcrow");
      const name = row ? row.dataset.svc : "service";
      const action = svcAct.dataset.svcAct;
      const stateDot = row ? row.querySelector(".dot") : null;
      if (stateDot) {
        stateDot.className = action === "stop" ? "dot" : "dot dot--ok";
      }
      const labels = { start: "démarré", stop: "arrêté", restart: "redémarré" };
      toast(`${name} ${labels[action] || "mis à jour"} (démonstration).`);
      return;
    }

    const confirm = target.closest("[data-confirm-yes], [data-confirm-no]");
    if (confirm) {
      const card = confirm.closest("[data-confirm]");
      if (card) {
        const approved = confirm.hasAttribute("data-confirm-yes");
        card.innerHTML = `<div class="confirm__title">${icon(approved ? "circle-check" : "x")} ${approved ? "Action exécutée" : "Action annulée"}</div>
          <div class="confirm__body">${approved ? "3 lumières éteintes · scène « Nuit » lancée." : "Aucun appareil n’a été modifié."}</div>`;
        toast(approved ? "Scène « Nuit » exécutée (démonstration)." : "Action annulée.");
      }
      return;
    }

    const toastEl = target.closest("[data-toast]");
    if (toastEl) {
      toast(toastEl.dataset.toast);
      return;
    }

    const scrim = target.closest("[data-overlay]");
    if (scrim && target === scrim) {
      closeOverlays();
      return;
    }

    if (target.closest("[data-popover]")) return;
    const popover = $("[data-popover]", device);
    if (popover && !target.closest("[data-notif]")) popover.remove();
  }

  function onDocumentSubmit(event) {
    const invite = event.target.closest("[data-invite-form]");
    if (invite) {
      event.preventDefault();
      closeOverlays();
      toast("Invitation envoyée (démonstration).");
      return;
    }

    const chat = event.target.closest("[data-chat-form]");
    if (chat) {
      event.preventDefault();
      const input = $("[data-chat-input]", chat);
      if (input) {
        sendChat(input.value);
        input.value = "";
      }
      return;
    }

    const command = event.target.closest("[data-cmd-form]");
    if (command) {
      event.preventDefault();
      const input = $("[data-cmd-input]", command);
      const value = input ? input.value.trim() : "";
      if (value) {
        state.pendingPrompt = value;
        go("assistant");
      }
      return;
    }

    const terminal = event.target.closest("[data-console-form]");
    if (terminal) {
      event.preventDefault();
      const input = $("[data-console-input]", terminal);
      if (input) {
        runConsole(input.value);
        input.value = "";
      }
    }
  }

  function onDocumentKeydown(event) {
    const consoleInput = event.target.closest("[data-console-input]");
    if (consoleInput && ML.console) {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        const list = ML.console.history;
        if (!list.length) return;
        state.consoleIndex = Math.min((state.consoleIndex ?? -1) + 1, list.length - 1);
        consoleInput.value = list[list.length - 1 - state.consoleIndex];
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        const list = ML.console.history;
        state.consoleIndex = Math.max((state.consoleIndex ?? 0) - 1, -1);
        consoleInput.value = state.consoleIndex >= 0 ? list[list.length - 1 - state.consoleIndex] : "";
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "l") {
        event.preventDefault();
        const body = $("[data-console-out]", view);
        if (body) body.innerHTML = "";
      }
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openPalette();
      return;
    }
    if (event.key === "Escape") {
      closeOverlays();
      const popover = $("[data-popover]", device);
      if (popover) popover.remove();
    }
  }

  function onDocumentInput(event) {
    if (event.target.closest("[data-app-search]")) {
      filterApps();
    }
    if (event.target.closest("[data-log-search]")) {
      filterLogs();
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Init                                                                    */
  /* ---------------------------------------------------------------------- */

  function init() {
    device = $("#device");
    app = $("#app");
    view = $("#view");
    sidebar = $("#sidebar");
    topbar = $("#topbar");
    mappbar = $("#mappbar");
    tabbar = $("#tabbar");

    const hash = window.location.hash.replace("#", "");
    if (ML.pages[hash]) state.page = hash;

    renderStudioIndex();
    renderSidebar();
    renderTopbar();
    renderMappbar();
    renderTabbar();
    setTheme(state.theme);
    setAccent(state.accent);
    renderPage();

    document.addEventListener("click", onDocumentClick);
    document.addEventListener("submit", onDocumentSubmit);
    document.addEventListener("keydown", onDocumentKeydown);
    document.addEventListener("input", onDocumentInput);

    window.addEventListener("hashchange", () => {
      const id = window.location.hash.replace("#", "");
      if (ML.pages[id] && id !== state.page) {
        state.page = id;
        renderPage();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window.ML);
