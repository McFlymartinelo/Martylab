/* ==========================================================================
   Martylab — prototype « Cockpit »
   Helpers, données de démonstration et registre de pages.
   ========================================================================== */

window.ML = (function () {
  const icon = (name, cls) =>
    `<svg class="ic${cls ? " " + cls : ""}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

  const mark = (cls) =>
    `<svg class="${cls || "mark"}" viewBox="0 0 32 32" aria-hidden="true">
      <rect x="2" y="2" width="13" height="13" rx="4" fill="currentColor"/>
      <rect x="17" y="2" width="13" height="13" rx="4" fill="currentColor" opacity=".32"/>
      <rect x="2" y="17" width="13" height="13" rx="4" fill="currentColor" opacity=".32"/>
      <rect x="17" y="17" width="13" height="13" rx="4" fill="var(--accent)"/>
    </svg>`;

  const dot = (kind) => `<span class="dot dot--${kind || "ok"}"></span>`;

  const badge = (text, kind, extra) =>
    `<span class="badge${kind ? " badge--" + kind : ""}${extra ? " " + extra : ""}">${text}</span>`;

  const bar = (value, kind) =>
    `<div class="bar${kind ? " bar--" + kind : ""}"><i style="width:${value}%"></i></div>`;

  const spark = (values, kind) => {
    const w = 120;
    const h = 30;
    const step = w / (values.length - 1);
    const line = values
      .map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)} ${(h - (v / 100) * (h - 4) - 2).toFixed(1)}`)
      .join(" ");
    const d = `${line} L${w} ${h} L0 ${h} Z`;
    return `<svg class="spark${kind ? " spark--" + kind : ""}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
      <path class="area" d="${d}"/><path class="line" d="${line}"/></svg>`;
  };

  const avatar = (initials, cls) =>
    `<span class="avatar${cls ? " " + cls : ""}">${initials}</span>`;

  const pagehead = (o) => `
    <div class="pagehead">
      <div class="pagehead__main">
        <div class="eyebrow">${o.eyebrow || ""}</div>
        <h1 class="page-title">${o.title}</h1>
        ${o.sub ? `<p class="page-sub">${o.sub}</p>` : ""}
      </div>
      ${o.actions ? `<div class="pagehead__actions">${o.actions}</div>` : ""}
    </div>`;

  const kpi = (label, value, unit, sub) => `
    <div class="kpi">
      <span class="kpi__label">${label}</span>
      <span class="kpi__value">${value}${unit ? `<small>${unit}</small>` : ""}</span>
      ${sub ? `<span class="kpi__sub">${sub}</span>` : ""}
    </div>`;

  /* ---------------------------------------------------------------------- */
  /* Données de démonstration (fictives, le prototype le revendique)        */
  /* ---------------------------------------------------------------------- */

  const APPS = [
    {
      id: "orion",
      name: "Orion",
      version: "1.4.2",
      enabled: true,
      caps: ["dashboard", "health", "actions", "notifications"],
      desc: "Maison connectée, capteurs, lumières et scènes.",
      latency: "38 ms",
      accent: true,
    },
    {
      id: "matchday",
      name: "Matchday",
      version: "2.1.0",
      enabled: true,
      caps: ["dashboard", "notifications"],
      desc: "Matchs, classement, pronostics et chat du groupe.",
      latency: "61 ms",
    },
    {
      id: "jellyfin",
      name: "Jellyfin",
      version: "10.10.3",
      enabled: true,
      caps: ["dashboard", "notifications"],
      desc: "Serveur média, bibliothèques et sessions actives.",
      latency: "24 ms",
    },
    {
      id: "immich",
      name: "Immich",
      version: "1.119.0",
      enabled: true,
      caps: ["dashboard"],
      desc: "Photos personnelles et albums partagés.",
      latency: "47 ms",
    },
    {
      id: "portainer",
      name: "Portainer",
      version: "2.21.4",
      enabled: true,
      caps: ["dashboard", "health"],
      desc: "Supervision des stacks et des conteneurs.",
      latency: "19 ms",
    },
    {
      id: "cloudflare",
      name: "Cloudflare",
      version: "1.0.0",
      enabled: true,
      caps: ["health", "network"],
      desc: "Tunnel public, DNS et certificats des sous-domaines.",
      latency: "12 ms",
    },
    {
      id: "nas",
      name: "NAS",
      version: "1.0.0",
      enabled: false,
      caps: ["health"],
      desc: "Stockage réseau, volumes et sauvegardes.",
      latency: "—",
    },
  ];

  const SERVICES = [
    { name: "Orion", icon: "sparkles", status: "ok", meta: "38 ms", accent: true },
    { name: "Matchday", icon: "trophy", status: "ok", meta: "61 ms" },
    { name: "Jellyfin", icon: "tv", status: "ok", meta: "24 ms" },
    { name: "Immich", icon: "images", status: "ok", meta: "47 ms" },
    { name: "Portainer", icon: "layers", status: "ok", meta: "19 ms" },
    { name: "Cloudflare", icon: "cloud", status: "warn", meta: "62 ms" },
  ];

  const CONTAINERS = [
    { stack: "martylab", name: "martylab-portal", image: "martylab/portal:0.4.2", state: "running", uptime: "12 j", icon: "globe" },
    { stack: "martylab", name: "martylab-backend", image: "martylab/backend:0.4.2", state: "running", uptime: "12 j", icon: "server" },
    { stack: "martylab", name: "martylab-postgres", image: "postgres:17-alpine", state: "running", uptime: "12 j", icon: "database" },
    { stack: "martylab", name: "cloudflared", image: "cloudflare/cloudflared:latest", state: "running", uptime: "12 j", icon: "cloud" },
    { stack: "media", name: "jellyfin", image: "jellyfin/jellyfin:10.10.3", state: "running", uptime: "8 j", icon: "tv" },
    { stack: "media", name: "immich-server", image: "ghcr.io/immich-app/immich:1.119", state: "running", uptime: "8 j", icon: "images" },
    { stack: "media", name: "immich-ml", image: "ghcr.io/immich-app/immich-ml:1.119", state: "running", uptime: "8 j", icon: "cpu" },
    { stack: "home", name: "orion", image: "martylab/orion:1.4.2", state: "running", uptime: "21 j", icon: "sparkles" },
    { stack: "home", name: "orion-db", image: "postgres:17-alpine", state: "running", uptime: "21 j", icon: "database" },
    { stack: "infra", name: "portainer", image: "portainer/portainer-ce:2.21", state: "exited", uptime: "—", icon: "layers" },
  ];

  const NAV = [
    {
      label: "Pilotage",
      ids: ["dashboard", "assistant"],
    },
    {
      label: "Infrastructure",
      ids: ["system", "services", "console"],
    },
    {
      label: "Univers",
      ids: ["matchday", "photos", "jellyfin"],
    },
    {
      label: "Configuration",
      ids: ["apps", "settings", "users", "plugins"],
    },
  ];

  const PAGES = [
    { id: "dashboard", label: "Tableau de bord", icon: "layout-dashboard", group: "Pilotage", inApp: true },
    { id: "assistant", label: "Assistant", icon: "bot", group: "Pilotage", inApp: true },
    { id: "matchday", label: "Matchday", icon: "trophy", group: "Univers", inApp: true },
    { id: "photos", label: "Photos", icon: "images", group: "Univers", inApp: true },
    { id: "jellyfin", label: "Jellyfin", icon: "tv", group: "Univers", inApp: true },
    { id: "system", label: "Système", icon: "server", group: "Infrastructure", inApp: true },
    { id: "services", label: "Services", icon: "container", group: "Infrastructure", inApp: true },
    { id: "console", label: "Console", icon: "terminal", group: "Infrastructure", inApp: true },
    { id: "apps", label: "Applications", icon: "blocks", group: "Configuration", inApp: true },
    { id: "settings", label: "Paramètres", icon: "settings", group: "Configuration", inApp: true },
    { id: "users", label: "Utilisateurs", icon: "users", group: "Configuration", inApp: true },
    { id: "plugins", label: "Plugins", icon: "puzzle", group: "Configuration", inApp: true, soon: true },
    { id: "login", label: "Connexion", icon: "key", group: "États", inApp: false },
    { id: "notfound", label: "Page 404", icon: "triangle-alert", group: "États", inApp: false },
  ];

  const byId = (id) => PAGES.find((p) => p.id === id);

  return {
    icon,
    mark,
    dot,
    badge,
    bar,
    spark,
    avatar,
    pagehead,
    kpi,
    APPS,
    SERVICES,
    CONTAINERS,
    NAV,
    PAGES,
    byId,
    pages: {},
  };
})();
