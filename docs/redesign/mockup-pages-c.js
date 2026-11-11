/* ==========================================================================
   Martylab — prototype « Cockpit »
   Écran : Système (télémétrie serveur complète, onglets).
   ========================================================================== */

(function (ML) {
  const { icon, dot, badge, bar, spark, pagehead, kpi } = ML;

  const kv = (label, value, cls) =>
    `<div class="kvrow"><span class="kvrow__k">${label}</span><span class="kvrow__v ${cls === false ? "" : "mono"}">${value}</span></div>`;

  const fact = (ic, label, value, sub) => `
    <article class="fact">
      <span class="fact__ic">${icon(ic)}</span>
      <span class="fact__label">${label}</span>
      <span class="fact__value">${value}</span>
      ${sub ? `<span class="fact__sub">${sub}</span>` : ""}
    </article>`;

  const tabs = [
    { id: "overview", label: "Vue d’ensemble" },
    { id: "network", label: "Réseau" },
    { id: "storage", label: "Stockage" },
    { id: "processes", label: "Processus" },
    { id: "hardware", label: "Matériel" },
    { id: "journal", label: "Journal", count: "24" },
  ];

  const containers = ML.CONTAINERS;

  const containerRows = containers
    .map(
      (c) => `
      <tr>
        <td data-label="Conteneur"><div><div class="tbl__name">${c.name}</div><div class="tbl__sub">${c.stack}</div></div></td>
        <td data-label="État">${c.state === "running" ? badge("running", "ok") : badge("exited", "")}</td>
        <td data-label="Image"><span class="mono small">${c.image}</span></td>
        <td data-label="Uptime"><span class="mono">${c.uptime}</span></td>
        <td data-label=""><div class="rowactions"><button class="iconbtn" data-nav="console" aria-label="Ouvrir la console">${icon("terminal")}</button><button class="iconbtn" data-toast="Logs de ${c.name} (démonstration)" aria-label="Logs">${icon("file-text")}</button></div></td>
      </tr>`,
    )
    .join("");

  const interfaces = [
    { name: "eth0", kind: "Physique · Intel I225-V", state: "up", ip: "192.168.1.42/24", speed: "1 Gb/s", rx: "1,42 To", tx: "386 Go" },
    { name: "wg0", kind: "WireGuard", state: "up", ip: "10.8.0.1/24", speed: "—", rx: "42,1 Go", tx: "8,4 Go" },
    { name: "docker0", kind: "Bridge Docker", state: "up", ip: "172.17.0.1/16", speed: "—", rx: "612 Go", tx: "415 Go" },
    { name: "lo", kind: "Loopback", state: "up", ip: "127.0.0.1/8", speed: "—", rx: "24,8 Go", tx: "24,8 Go" },
  ];

  const hosts = [
    ["martylab.fr", "martylab-portal:3000", "ok", "24 ms"],
    ["orion.martylab.fr", "orion:8080", "ok", "38 ms"],
    ["matchday.martylab.fr", "matchday:3000", "ok", "61 ms"],
    ["jellyfin.martylab.fr", "jellyfin:8096", "ok", "24 ms"],
    ["photos.martylab.fr", "immich-server:2283", "ok", "47 ms"],
    ["portainer.martylab.fr", "portainer:9000", "warn", "112 ms"],
    ["status.martylab.fr", "uptime-kuma:3001", "ok", "19 ms"],
  ];

  const ports = [
    ["22", "ssh", "0.0.0.0", "admin"],
    ["443", "cloudflared", "0.0.0.0", "public"],
    ["3000", "martylab-backend", "127.0.0.1", "local"],
    ["5432", "postgres", "127.0.0.1", "local"],
    ["8080", "cloudflared (metrics)", "127.0.0.1", "local"],
    ["8096", "jellyfin", "172.17.0.2", "docker"],
    ["2283", "immich-server", "172.17.0.4", "docker"],
  ];

  const disks = [
    { dev: "nvme0n1", model: "Samsung 980 Pro", size: "1 To", temp: "41 °C", health: "PASSED", hours: "12 480 h", wear: "7 %" },
    { dev: "sda", model: "WD Red Plus", size: "4 To", temp: "38 °C", health: "PASSED", hours: "21 400 h", wear: "—" },
    { dev: "sdb", model: "WD Red Plus", size: "4 To", temp: "39 °C", health: "PASSED", hours: "21 400 h", wear: "—" },
  ];

  const volumes = [
    { label: "/", fs: "ext4", value: 71, note: "1,7 To / 2,4 To", inode: "18 %" },
    { label: "/var/lib/docker", fs: "overlay2", value: 64, note: "624 Go / 980 Go", inode: "31 %" },
    { label: "/mnt/nas", fs: "nfs4", value: 64, note: "8,4 To / 13,1 To", inode: "4 %" },
    { label: "/backups", fs: "ext4", value: 38, note: "412 Go / 1,1 To", inode: "2 %" },
  ];

  const processes = [
    { pid: 2140, user: "alex", name: "immich-ml", cmd: "/usr/bin/python3 -m immich_ml", cpu: "18,4", mem: "1,8 Go", pct: 46, state: "S" },
    { pid: 812, user: "node", name: "martylab-backend", cmd: "node dist/server.js", cpu: "6,2", mem: "1,2 Go", pct: 31, state: "S" },
    { pid: 640, user: "postgres", name: "postgres", cmd: "postgres: checkpointer", cpu: "1,4", mem: "412 Mo", pct: 11, state: "S" },
    { pid: 1204, user: "jellyfin", name: "jellyfin", cmd: "/usr/bin/jellyfin --datadir /config", cpu: "4,8", mem: "388 Mo", pct: 10, state: "R" },
    { pid: 512, user: "root", name: "dockerd", cmd: "/usr/bin/dockerd -H fd://", cpu: "2,1", mem: "186 Mo", pct: 5, state: "S" },
    { pid: 980, user: "root", name: "cloudflared", cmd: "cloudflared tunnel run martylab-prod", cpu: "1,2", mem: "94 Mo", pct: 3, state: "S" },
    { pid: 3350, user: "alex", name: "ssh", cmd: "sshd: alex@pts/0", cpu: "0,1", mem: "8 Mo", pct: 1, state: "S" },
  ];

  const logs = [
    ["09:41:02", "ok", "INFO", "martylab-backend", "GET /api/system/metrics 200 · 14 ms"],
    ["09:41:00", "ok", "INFO", "cloudflared", "Registered tunnel connection · martylab-prod (cdg04)"],
    ["09:40:52", "warn", "WARN", "nginx", "upstream portainer.martylab.fr responded in 112 ms"],
    ["09:39:18", "ok", "INFO", "dockerd", "Container jellyfin started (health: starting)"],
    ["09:38:11", "warn", "WARN", "immich-server", "job queue backlog above 50 items"],
    ["09:36:40", "ok", "INFO", "systemd", "Started Daily apt upgrade and clean activities"],
    ["09:35:07", "ok", "INFO", "postgres", "checkpoint complete: wrote 412 buffers (2,5 %)"],
    ["09:12:44", "ok", "INFO", "backup", "postgres.dump · 412 Mo · sha256 verified"],
    ["09:04:31", "danger", "ERROR", "martylab-backend", "orion healthcheck failed once (retry OK, 38 ms)"],
    ["08:55:12", "ok", "INFO", "orion", "scene « Réveil » executed · 5 entities"],
  ];

  const SYSTEM_PANELS = {
    overview: `
      <section class="panel panel--hero">
        <div class="syshero">
          <div class="ring" style="--v:96;--c:var(--accent)">
            <div class="ring__val">96<small>/100</small></div>
            <div class="ring__cap">Santé serveur</div>
          </div>

          <div class="syshero__dials">
            <div class="dialwrap">
              <div class="dial" style="--v:34;--c:var(--accent)"><span class="dial__val">34<small>%</small></span></div>
              <span class="tiny"><b>CPU</b><span class="dialwrap__d"> · 8 cœurs</span></span>
            </div>
            <div class="dialwrap">
              <div class="dial" style="--v:62"><span class="dial__val">62<small>%</small></span></div>
              <span class="tiny"><b>RAM</b><span class="dialwrap__d"> · 9,9 / 16 Go</span></span>
            </div>
            <div class="dialwrap">
              <div class="dial" style="--v:71;--c:var(--warn)"><span class="dial__val">71<small>%</small></span></div>
              <span class="tiny"><b>Disque</b><span class="dialwrap__d"> · 1,7 / 2,4 To</span></span>
            </div>
          </div>

          <div class="syshero__side">
            <div class="sysmini">${icon("clock")}<span class="sysmini__label">Uptime</span><span class="sysmini__val">42 j 06 h</span></div>
            <div class="sysmini">${icon("activity")}<span class="sysmini__label">Charge 1/5/15</span><span class="sysmini__val">0,42 · 0,38 · 0,31</span></div>
            <div class="sysmini">${icon("thermometer")}<span class="sysmini__label">CPU / NVMe</span><span class="sysmini__val">48 / 41 °C</span></div>
            <div class="sysmini">${icon("network")}<span class="sysmini__label">Réseau ↓ / ↑</span><span class="sysmini__val">12,4 / 2,1 Mo/s</span></div>
            <div class="sysmini">${icon("database")}<span class="sysmini__label">Swap</span><span class="sysmini__val">412 Mo / 2 Go</span></div>
            <div class="sysmini">${icon("shield")}<span class="sysmini__label">Màj sécurité</span><span class="sysmini__val">3 en attente</span></div>
          </div>
        </div>
      </section>

      <div class="grid-4">
        <div class="panel kpicard">${kpi("Hôte", "martylab-prod", "", "Debian 13 · kernel 6.12.38")}</div>
        <div class="panel kpicard">${kpi("Démarré le", "30 sept.", "", "03:12 · 42 jours d’uptime")}</div>
        <div class="panel kpicard">${kpi("Conteneurs", "9", "/ 10", "1 arrêté · 4 stacks")}</div>
        <div class="panel kpicard">${kpi("Dernière sauvegarde", "09:12", "", "PostgreSQL · 412 Mo · vérifiée")}</div>
      </div>

      <div>
        <div class="section__head">
          <div class="section__title">${icon("layers")} Connecteurs d’infrastructure</div>
          <span class="panel__hint">3 / 3 en ligne</span>
        </div>
        <div class="infra">
          <article class="infra__card">
            <div class="infra__top"><span class="infra__icon">${icon("layers")}</span><div class="grow"><div class="infra__name">Portainer</div><div class="infra__meta">3 stacks · API 19 ms</div></div>${badge("ok", "ok")}</div>
            <div class="infra__stats">
              <div class="infra__stat"><b>10</b><span>conteneurs</span></div>
              <div class="infra__stat"><b>9</b><span>en marche</span></div>
              <div class="infra__stat"><b>1</b><span>arrêté</span></div>
            </div>
          </article>
          <article class="infra__card">
            <div class="infra__top"><span class="infra__icon">${icon("cloud")}</span><div class="grow"><div class="infra__name">Cloudflare Tunnel</div><div class="infra__meta">martylab-prod · 62 ms</div></div>${badge("lent", "warn")}</div>
            <div class="infra__stats">
              <div class="infra__stat"><b>7</b><span>hôtes</span></div>
              <div class="infra__stat"><b>4</b><span>connexions</span></div>
              <div class="infra__stat"><b>0</b><span>erreur 5xx</span></div>
            </div>
          </article>
          <article class="infra__card">
            <div class="infra__top"><span class="infra__icon">${icon("hard-drive")}</span><div class="grow"><div class="infra__name">NAS</div><div class="infra__meta">RAID 5 sain · 19 ms</div></div>${badge("ok", "ok")}</div>
            <div class="infra__stats">
              <div class="infra__stat"><b>8,4</b><span>To utilisés</span></div>
              <div class="infra__stat"><b>3,6</b><span>To libres</span></div>
              <div class="infra__stat"><b>38 °C</b><span>disques</span></div>
            </div>
          </article>
        </div>
      </div>

      <section class="panel panel--flush">
        <div class="panel__head" style="padding:14px 16px 12px;margin:0">
          <span class="panel__title">${icon("container")} Conteneurs</span>
          <button class="panel__link" data-nav="services">Gérer les services ${icon("arrow-right")}</button>
        </div>
        <div class="tblwrap">
          <table class="tbl">
            <thead><tr><th>Conteneur</th><th>État</th><th>Image</th><th>Uptime</th><th></th></tr></thead>
            <tbody>${containerRows}</tbody>
          </table>
        </div>
      </section>

      <div class="grid-2">
        <section class="panel">
          <div class="panel__head"><span class="panel__title">${icon("server")} Faits système</span><span class="panel__hint">Uname</span></div>
          ${kv("Hôte", "martylab-prod")}
          ${kv("Système", "Debian 13 (trixie)")}
          ${kv("Noyau", "6.12.38-amd64")}
          ${kv("Architecture", "x86_64")}
          ${kv("Fuseau", "Europe/Paris")}
          ${kv("Docker", "27.3.1 · Compose 2.30")}
          ${kv("Dernier démarrage", "30 sept. 2026 · 03:12")}
        </section>
        <section class="panel">
          <div class="panel__head"><span class="panel__title">${icon("triangle-alert")} À surveiller</span>${badge("2 éléments", "warn")}</div>
          <div class="listrow">
            <span class="listrow__icon listrow__icon--accent">${icon("hard-drive")}</span>
            <div class="listrow__body"><div class="listrow__title">Racine à 71 %</div><div class="listrow__sub">Seuil d’alerte à 80 % · 712 Go libres</div></div>
            ${badge("warn", "warn")}
          </div>
          <div class="listrow">
            <span class="listrow__icon">${icon("cloud")}</span>
            <div class="listrow__body"><div class="listrow__title">Tunnel Cloudflare lent</div><div class="listrow__sub">p95 à 88 ms · Portainer à 112 ms</div></div>
            ${badge("warn", "warn")}
          </div>
          <div class="listrow">
            <span class="listrow__icon">${icon("shield")}</span>
            <div class="listrow__body"><div class="listrow__title">3 mises à jour de sécurité</div><div class="listrow__sub">Aucun redémarrage requis</div></div>
            ${badge("planifié", "")}
          </div>
        </section>
      </div>
    `,

    network: `
      <div class="grid-2">
        <section class="panel">
          <div class="panel__head"><span class="panel__title">${icon("activity")} Trafic</span><span class="panel__hint">60 dernières secondes</span></div>
          <div class="row row--between"><span class="kpi__label">Descendant</span><span class="mono small">12,4 Mo/s <span class="muted">· pic 38,2</span></span></div>
          ${spark([18, 22, 30, 26, 41, 34, 48, 52, 44, 38, 46, 55], "accent")}
          <div class="row row--between" style="margin-top:12px"><span class="kpi__label">Montant</span><span class="mono small">2,1 Mo/s <span class="muted">· pic 6,4</span></span></div>
          ${spark([12, 14, 11, 18, 16, 21, 19, 24, 22, 18, 20, 23])}
          <div class="hr"></div>
          <div class="grid-3">
            ${kpi("Paquets/s", "8 412", "", "0 drop · 0 erreur")}
            ${kpi("Latence API", "42 ms", "", "p95 · 88 ms")}
            ${kpi("Connexions", "184", "", "dont 62 keep-alive")}
          </div>
        </section>

        <section class="panel">
          <div class="panel__head"><span class="panel__title">${icon("cloud")} Tunnel Cloudflare</span>${badge("dégradé", "warn")}</div>
          ${kv("Tunnel", "martylab-prod")}
          ${kv("Version", "cloudflared 2026.7.0")}
          ${kv("Connexions", "4 / 4 · cdg04 · cdg05")}
          ${kv("Latence", "62 ms · p95 88 ms", false)}
          ${kv("Hôtes", "7 sous-domaines")}
          ${kv("Erreurs 5xx (24 h)", "0")}
          ${kv("Certificat", "expire dans 68 jours")}
          <div class="row" style="margin-top:10px">
            <button class="btn btn--sm" data-toast="Test de latence lancé (démonstration)">${icon("refresh-cw")} Tester</button>
            <button class="btn btn--sm" data-nav="console">${icon("terminal")} Console</button>
          </div>
        </section>
      </div>

      <section class="panel panel--flush">
        <div class="panel__head" style="padding:14px 16px 12px;margin:0">
          <span class="panel__title">${icon("network")} Interfaces</span>
          <span class="panel__hint">4 interfaces · 1 Gb/s</span>
        </div>
        <div class="tblwrap">
          <table class="tbl">
            <thead><tr><th>Interface</th><th>Type</th><th>État</th><th>Adresse</th><th>Débit</th><th>RX</th><th>TX</th></tr></thead>
            <tbody>
              ${interfaces
                .map(
                  (i) => `<tr>
                    <td data-label="Interface"><span class="tbl__name mono">${i.name}</span></td>
                    <td data-label="Type"><span class="small">${i.kind}</span></td>
                    <td data-label="État">${badge(i.state, "ok")}</td>
                    <td data-label="Adresse"><span class="mono small">${i.ip}</span></td>
                    <td data-label="Débit"><span class="mono small">${i.speed}</span></td>
                    <td data-label="RX"><span class="mono small">${i.rx}</span></td>
                    <td data-label="TX"><span class="mono small">${i.tx}</span></td>
                  </tr>`,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>

      <div class="grid-2">
        <section class="panel panel--flush">
          <div class="panel__head" style="padding:14px 16px 12px;margin:0"><span class="panel__title">${icon("globe")} Hôtes publics</span><span class="panel__hint">Cloudflare</span></div>
          <div class="tblwrap">
            <table class="tbl">
              <thead><tr><th>Hôte</th><th>Cible</th><th>État</th><th>Latence</th></tr></thead>
              <tbody>
                ${hosts
                  .map(
                    (h) => `<tr>
                      <td data-label="Hôte"><span class="tbl__name mono">${h[0]}</span></td>
                      <td data-label="Cible"><span class="mono small muted">${h[1]}</span></td>
                      <td data-label="État">${badge(h[2] === "ok" ? "ok" : "lent", h[2] === "ok" ? "ok" : "warn")}</td>
                      <td data-label="Latence"><span class="mono small">${h[3]}</span></td>
                    </tr>`,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </section>

        <section class="panel panel--flush">
          <div class="panel__head" style="padding:14px 16px 12px;margin:0"><span class="panel__title">${icon("radio")} Ports en écoute</span><span class="panel__hint">ss -tulpn</span></div>
          <div class="tblwrap">
            <table class="tbl">
              <thead><tr><th>Port</th><th>Processus</th><th>Bind</th><th>Portée</th></tr></thead>
              <tbody>
                ${ports
                  .map(
                    (p) => `<tr>
                      <td data-label="Port"><span class="tbl__name mono">${p[0]}</span></td>
                      <td data-label="Processus"><span class="small">${p[1]}</span></td>
                      <td data-label="Bind"><span class="mono small">${p[2]}</span></td>
                      <td data-label="Portée">${badge(p[3], p[3] === "public" ? "warn" : "")}</td>
                    </tr>`,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    `,

    storage: `
      <section class="panel">
        <div class="panel__head"><span class="panel__title">${icon("hard-drive")} Volumes</span><span class="panel__hint">Capacité & inodes</span></div>
        ${volumes
          .map(
            (v) => `
          <div style="margin-top:12px">
            <div class="row row--between" style="margin-bottom:4px">
              <span class="small"><b class="mono">${v.label}</b> <span class="muted">· ${v.fs}</span></span>
              <span class="mono small muted">${v.note} · inodes ${v.inode}</span>
            </div>
            ${bar(v.value, v.value >= 70 ? "warn" : "")}
          </div>`,
          )
          .join("")}
        <div class="hr"></div>
        <div class="grid-4">
          ${kpi("Total monté", "17,6 To", "", "5 systèmes de fichiers")}
          ${kpi("Utilisé", "11,1 To", "", "63 % de la capacité")}
          ${kpi("Écriture 24 h", "84 Go", "", "dont 62 Go de médias")}
          ${kpi("Trim", "actif", "", "nvme0n1 · hebdomadaire")}
        </div>
      </section>

      <section class="panel panel--flush">
        <div class="panel__head" style="padding:14px 16px 12px;margin:0">
          <span class="panel__title">${icon("scan-line")} Disques & SMART</span>
          <span class="panel__hint">3 disques · 0 secteur réalloué</span>
        </div>
        <div class="tblwrap">
          <table class="tbl">
            <thead><tr><th>Périphérique</th><th>Modèle</th><th>Capacité</th><th>Temp.</th><th>Santé</th><th>Heures</th><th>Usure</th></tr></thead>
            <tbody>
              ${disks
                .map(
                  (d) => `<tr>
                    <td data-label="Périphérique"><span class="tbl__name mono">${d.dev}</span></td>
                    <td data-label="Modèle"><span class="small">${d.model}</span></td>
                    <td data-label="Capacité"><span class="mono small">${d.size}</span></td>
                    <td data-label="Température"><span class="mono small">${d.temp}</span></td>
                    <td data-label="Santé">${badge(d.health.toLowerCase(), "ok")}</td>
                    <td data-label="Heures"><span class="mono small">${d.hours}</span></td>
                    <td data-label="Usure"><span class="mono small">${d.wear}</span></td>
                  </tr>`,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>

      <div class="grid-3">
        <section class="panel">
          <div class="panel__head"><span class="panel__title">${icon("activity")} I/O disque</span><span class="panel__hint">temps réel</span></div>
          ${spark([22, 28, 19, 34, 41, 30, 26, 38, 44, 36, 31, 40], "accent")}
          <div class="hr"></div>
          ${kv("Lecture", "42,4 Mo/s")}
          ${kv("Écriture", "12,8 Mo/s")}
          ${kv("IOPS", "1 240")}
          ${kv("Attente moyenne", "0,8 ms")}
          ${kv("Utilisation", "34 %")}
        </section>
        <section class="panel">
          <div class="panel__head"><span class="panel__title">${icon("layers")} RAID & NAS</span>${badge("sain", "ok")}</div>
          ${kv("Array", "/dev/md0 · RAID 1")}
          ${kv("Membres", "sda + sdb")}
          ${kv("État", "clean · 2 / 2")}
          ${kv("Resync", "jamais nécessaire")}
          ${kv("NFS", "/mnt/nas · nfs4")}
          ${kv("Latence NAS", "19 ms")}
        </section>
        <section class="panel">
          <div class="panel__head"><span class="panel__title">${icon("database")} Sauvegardes</span><span class="panel__hint">3 jobs</span></div>
          <div class="listrow">
            <span class="listrow__icon listrow__icon--accent">${icon("database")}</span>
            <div class="listrow__body"><div class="listrow__title">PostgreSQL</div><div class="listrow__sub">09:12 · 412 Mo · vérifiée</div></div>
            ${badge("ok", "ok")}
          </div>
          <div class="listrow">
            <span class="listrow__icon">${icon("server")}</span>
            <div class="listrow__body"><div class="listrow__title">Configuration</div><div class="listrow__sub">03:00 · 12 Mo · chiffrée</div></div>
            ${badge("ok", "ok")}
          </div>
          <div class="listrow">
            <span class="listrow__icon">${icon("hard-drive")}</span>
            <div class="listrow__body"><div class="listrow__title">Médias → NAS</div><div class="listrow__sub">04:00 · 62 Go · 18 min</div></div>
            ${badge("ok", "ok")}
          </div>
        </section>
      </div>
    `,

    processes: `
      <div class="grid-4">
        <div class="panel kpicard">${kpi("Processus", "214", "", "412 threads · 0 zombie")}</div>
        <div class="panel kpicard">${kpi("Charge 1 min", "0,42", "", "8 cœurs · 5 %")}</div>
        <div class="panel kpicard">${kpi("Plus gros CPU", "immich-ml", "", "18,4 % · 1,8 Go")}</div>
        <div class="panel kpicard">${kpi("Services systemd", "42", "actifs", "0 en échec")}</div>
      </div>

      <section class="panel panel--flush">
        <div class="panel__head" style="padding:14px 16px 12px;margin:0">
          <span class="panel__title">${icon("cpu")} Processus</span>
          <div class="row">
            <span class="panel__hint">triés par mémoire</span>
            <button class="iconbtn" data-toast="Processus actualisés (démonstration)" aria-label="Actualiser">${icon("refresh-cw")}</button>
          </div>
        </div>
        <div class="tblwrap">
          <table class="tbl">
            <thead><tr><th>PID</th><th>Processus</th><th>Utilisateur</th><th>CPU</th><th>Mémoire</th><th>État</th><th></th></tr></thead>
            <tbody>
              ${processes
                .map(
                  (p) => `<tr>
                    <td data-label="PID"><span class="mono small">${p.pid}</span></td>
                    <td data-label="Processus"><div><div class="tbl__name">${p.name}</div><div class="tbl__sub">${p.cmd}</div></div></td>
                    <td data-label="Utilisateur"><span class="mono small">${p.user}</span></td>
                    <td data-label="CPU"><span class="mono small">${p.cpu} %</span></td>
                    <td data-label="Mémoire"><div style="min-width:110px"><div class="row row--between" style="margin-bottom:3px"><span class="mono small">${p.mem}</span><span class="mono tiny">${p.pct} %</span></div>${bar(p.pct)}</div></td>
                    <td data-label="État">${badge(p.state === "R" ? "actif" : "veille", p.state === "R" ? "accent" : "")}</td>
                    <td data-label=""><div class="rowactions"><button class="iconbtn" data-toast="Détails du processus ${p.pid} (démonstration)" aria-label="Détails">${icon("eye")}</button></div></td>
                  </tr>`,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>

      <div class="grid-2">
        <section class="panel">
          <div class="panel__head"><span class="panel__title">${icon("activity")} Top CPU</span><span class="panel__hint">%</span></div>
          ${processes
            .slice()
            .sort((a, b) => Number(b.cpu.replace(",", ".")) - Number(a.cpu.replace(",", ".")))
            .slice(0, 5)
            .map(
              (p) => `<div style="margin-top:10px">
                <div class="row row--between" style="margin-bottom:4px"><span class="small"><b>${p.name}</b></span><span class="mono small muted">${p.cpu} %</span></div>
                ${bar(Math.min(100, Number(p.cpu.replace(",", ".")) * 4), "accent")}
              </div>`,
            )
            .join("")}
        </section>
        <section class="panel">
          <div class="panel__head"><span class="panel__title">${icon("layers")} Unités systemd</span>${badge("0 échec", "ok")}</div>
          ${kv("martylab-backend.service", "active · 12 j")}
          ${kv("docker.service", "active · 42 j")}
          ${kv("cloudflared.service", "active · 42 j")}
          ${kv("postgresql.service", "active · 12 j")}
          ${kv("ssh.service", "active · 42 j")}
          ${kv("apt-daily.timer", "en attente · 06:00")}
          <div class="row" style="margin-top:10px"><button class="btn btn--sm" data-nav="console">${icon("terminal")} Console</button></div>
        </section>
      </div>
    `,

    hardware: `
      <div class="facts">
        ${fact("cpu", "Processeur", "Intel Core i5-12400", "6 cœurs / 12 threads · 2,5–4,4 GHz · L3 18 Mo")}
        ${fact("memory-stick", "Mémoire", "16 Go DDR4-3200", "2 × 8 Go · 2 / 4 slots · non-ECC")}
        ${fact("layers", "Carte mère", "ASUS ROG STRIX B660-I", "BIOS 3202 · mai 2026 · chipset B660")}
        ${fact("monitor", "Graphique", "Intel UHD 730", "QuickSync · transcodage Jellyfin")}
        ${fact("network", "Réseau", "Intel I225-V", "2,5 GbE · eth0 · 1 Gb/s négocié")}
        ${fact("hard-drive", "Stockage", "1 To NVMe + 8 To HDD", "Samsung 980 Pro · 2 × WD Red 4 To")}
        ${fact("power", "Alimentation", "96 W", "mesuré · pic 142 W · 80+ Gold")}
        ${fact("clock", "Uptime", "42 j 06 h", "dernier démarrage 30 sept. 03:12")}
      </div>

      <div class="grid-2">
        <section class="panel">
          <div class="panel__head"><span class="panel__title">${icon("thermometer")} Capteurs</span><span class="panel__hint">lm-sensors</span></div>
          ${[
            ["CPU package", 48, "48 °C"],
            ["Cœur 0", 44, "44 °C"],
            ["Cœur 5", 51, "51 °C"],
            ["NVMe", 41, "41 °C"],
            ["Disque sda", 38, "38 °C"],
            ["Disque sdb", 39, "39 °C"],
          ]
            .map(
              (s) => `<div style="margin-top:9px">
                <div class="row row--between" style="margin-bottom:4px"><span class="small">${s[0]}</span><span class="mono small muted">${s[2]}</span></div>
                ${bar(s[1], s[1] > 60 ? "warn" : "ok")}
              </div>`,
            )
            .join("")}
          <div class="hr"></div>
          <div class="row row--between"><span class="small muted">Ventilateur boîtier</span><span class="mono small">820 rpm</span></div>
          <div class="row row--between" style="margin-top:6px"><span class="small muted">Ventilateur CPU</span><span class="mono small">1 140 rpm</span></div>
        </section>

        <section class="panel">
          <div class="panel__head"><span class="panel__title">${icon("sliders-horizontal")} Plateforme</span><span class="panel__hint">DMI / noyau</span></div>
          ${kv("Firmware", "UEFI · Secure Boot actif")}
          ${kv("Noyau", "6.12.38-amd64")}
          ${kv("Governor", "schedutil")}
          ${kv("Fréquence", "2,9 GHz moyen · pic 4,4")}
          ${kv("Virtualisation", "KVM · Docker 27.3.1")}
          ${kv("Modules", "nvidia? non · i915 · wireguard")}
          ${kv("Watchdog", "actif · 10 s")}
          <div class="hr"></div>
          <p class="tiny" style="line-height:1.5">Les valeurs matérielles proviennent de <b>/proc</b>, <b>/sys</b> et de <b>lm-sensors</b> via le backend. Aucune commande shell n’est exposée au navigateur.</p>
        </section>
      </div>
    `,

    journal: `
      <section class="panel">
        <div class="panel__head">
          <span class="panel__title">${icon("file-text")} Journal système</span>
          <span class="panel__hint">24 événements · 24 h</span>
        </div>
        <div class="chips" style="margin-bottom:10px">
          <button class="chip is-active" data-log-filter="all" aria-pressed="true">Tout</button>
          <button class="chip" data-log-filter="warn" aria-pressed="false">Avertissements</button>
          <button class="chip" data-log-filter="danger" aria-pressed="false">Erreurs</button>
          <button class="chip" data-log-filter="systemd" aria-pressed="false">systemd</button>
          <button class="chip" data-log-filter="docker" aria-pressed="false">Docker</button>
          <span class="filterbar__spacer"></span>
          <label class="search" style="width:220px">${icon("search")}<input data-log-search placeholder="Filtrer le journal…"></label>
        </div>
        <div class="loglist">
          ${logs
            .map(
              (l) => `<div class="logline" data-log-item data-log-kind="${l[1]}" data-log-unit="${l[3]}">
                <span class="logline__t">${l[0]}</span>
                <span class="logline__lvl ${l[1]}">${l[2]}</span>
                <span class="logline__u">${l[3]}</span>
                <span class="logline__m">${l[4]}</span>
              </div>`,
            )
            .join("")}
        </div>
        <div class="row row--between" style="margin-top:10px">
          <span class="tiny">Journal lu via <b>journalctl</b> côté serveur · rétention 30 jours</span>
          <button class="btn btn--sm" data-nav="console">${icon("terminal")} Ouvrir la console</button>
        </div>
      </section>

      <div class="grid-2">
        <section class="panel">
          <div class="panel__head"><span class="panel__title">${icon("triangle-alert")} Unités en échec</span>${badge("aucune", "ok")}</div>
          <div class="empty">Aucune unité systemd en échec.</div>
        </section>
        <section class="panel">
          <div class="panel__head"><span class="panel__title">${icon("history")} Derniers démarrages</span><span class="panel__hint">journalctl --list-boots</span></div>
          ${kv("0 · 30 sept. 03:12", "actuel · 42 j")}
          ${kv("-1 · 18 sept. 02:40", "mise à jour noyau")}
          ${kv("-2 · 04 sept. 23:10", "coupure électrique")}
          ${kv("-3 · 12 août 01:05", "redémarrage manuel")}
        </section>
      </div>
    `,
  };

  ML.pages.system = {
    title: "Système",
    render() {
      return `
        ${pagehead({
          eyebrow: "Infrastructure · mesure à 09:42 · Europe/Paris",
          title: "Système",
          sub: "Télémétrie complète du serveur : santé, réseau, stockage, processus, matériel et journal — sans quitter Martylab.",
          actions: `
            <button class="btn" data-toast="Mesures actualisées (démonstration)">${icon("refresh-cw")} Actualiser</button>
            <button class="btn" data-nav="console">${icon("terminal")} Console</button>
            <button class="btn" data-toast="Ouverture de Portainer (démonstration)">${icon("external-link")} Portainer</button>`,
        })}

        <nav class="subnav" role="tablist" aria-label="Sections du système">
          ${tabs
            .map(
              (t, i) => `<button class="subtab ${i === 0 ? "is-active" : ""}" role="tab" aria-selected="${i === 0}" data-sys-tab="${t.id}">
                ${t.label}${t.count ? `<span class="subtab__count">${t.count}</span>` : ""}
              </button>`,
            )
            .join("")}
        </nav>

        <div class="syspanel" data-sys-panel="overview">${SYSTEM_PANELS.overview}</div>
        <div class="syspanel" data-sys-panel="network" hidden>${SYSTEM_PANELS.network}</div>
        <div class="syspanel" data-sys-panel="storage" hidden>${SYSTEM_PANELS.storage}</div>
        <div class="syspanel" data-sys-panel="processes" hidden>${SYSTEM_PANELS.processes}</div>
        <div class="syspanel" data-sys-panel="hardware" hidden>${SYSTEM_PANELS.hardware}</div>
        <div class="syspanel" data-sys-panel="journal" hidden>${SYSTEM_PANELS.journal}</div>
      `;
    },
  };
})(window.ML);
