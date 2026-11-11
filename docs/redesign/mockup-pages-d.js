/* ==========================================================================
   Martylab — prototype « Cockpit »
   Écran : Console (allowlist, confirmation, journal d’audit).
   ========================================================================== */

(function (ML) {
  const { icon, badge, pagehead } = ML;

  const esc = (value) =>
    String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const out = (cls, text) => ({ cls, text });

  const HEADER = [
    out("dim", "Martylab console · admin · shell allowlisté"),
    out("dim", "Tape « help » pour les commandes autorisées."),
    out("dim", "↑ historique · Ctrl+L efface"),
    out("dim", ""),
  ];

  const OUTPUT = {
    help: [
      out("accent", "COMMANDES AUTORISÉES"),
      out("", "  martylab status        état du labo"),
      out("", "  docker ps              conteneurs actifs"),
      out("", "  docker logs <service>  logs d’un conteneur"),
      out("", "  docker restart <svc>   action · confirmation"),
      out("", "  df -h                  systèmes de fichiers"),
      out("", "  free -h                mémoire et swap"),
      out("", "  uptime                 charge et uptime"),
      out("", "  sensors                températures"),
      out("", "  ss -tulpn              ports en écoute"),
      out("", "  journalctl -n 5        5 derniers événements"),
      out("", "  uname -a               noyau et architecture"),
      out("dim", ""),
      out("dim", "Tout le reste est refusé. Aucun shell libre, pas de sudo."),
    ],
    "martylab status": [
      out("accent", "MARTYLAB · martylab-prod"),
      out("", "Hôte        martylab-prod"),
      out("", "Système     Debian 13 · 6.12.38-amd64"),
      out("", "Uptime      42 j 06 h"),
      out("", "Charge      0,42 / 0,38 / 0,31 · 8 cœurs"),
      out("", "Mémoire     9,9 / 16 Go · swap 412 Mo"),
      out("", "Disque      1,7 / 2,4 To (71 %)"),
      out("", "NAS         8,4 / 13,1 To (64 %)"),
      out("", "Réseau      ↓ 12,4 · ↑ 2,1 Mo/s · 0 erreur"),
      out("ok", "Conteneurs  9 en marche · 1 arrêté"),
      out("warn", "Services    6 / 7 · Portainer dégradé"),
      out("ok", "Sauvegarde  PostgreSQL · 09:12 · OK"),
    ],
    "docker ps": [
      out("dim", "CONTAINER  NAME              IMAGE          ÉTAT"),
      out("", "3f9c1a02   martylab-portal   portal:0.4.2   up 12 j"),
      out("", "8a12de44   martylab-backend  backend:0.4.2  up 12 j"),
      out("", "c710bb2e   martylab-postgres postgres:17    up 12 j"),
      out("", "d55e9a1c   cloudflared       cf:2026.7.0    up 12 j"),
      out("", "e21b7c9d   jellyfin          jellyfin:10.10 up 8 j"),
      out("", "a44f0e6b   immich-server     immich:1.119   up 8 j"),
      out("", "b98d3f1a   immich-ml         immich-ml:1.11 up 8 j"),
      out("warn", "f02c8b7d   portainer         portainer:2.21 exited (0)"),
    ],
    "df -h": [
      out("dim", "FILESYSTEM      SIZE  USED  AVAIL  USE%  MOUNTED ON"),
      out("", "/dev/nvme0n1p2  2,4T  1,7T  712G   71%   /"),
      out("", "/dev/nvme0n1p1  512M  42M   470M   9%    /boot/efi"),
      out("warn", "overlay         980G  624G  356G   64%   /var/lib/docker"),
      out("", "nas:/volume1    13,1T 8,4T  3,6T   64%   /mnt/nas"),
      out("", "/dev/sdc1       1,1T  412G  688G   38%   /backups"),
    ],
    "free -h": [
      out("dim", "         total  used   libre  cache  dispo"),
      out("", "Mem:     16Gi   9,9Gi  1,2Gi  4,9Gi  5,6Gi"),
      out("", "Swap:    2,0Gi  412Mi  1,6Gi"),
    ],
    uptime: [out("", " 09:42:07 up 42 days,  6:30,  1 user,  load average: 0,42, 0,38, 0,31")],
    "journalctl -n 5": [
      out("dim", "nov. 11 09:41:02 martylab-prod martylab-backend[812]: GET /api/system/metrics 200 14ms"),
      out("dim", "nov. 11 09:41:00 martylab-prod cloudflared[980]: Registered tunnel connection (cdg04)"),
      out("warn", "nov. 11 09:40:52 martylab-prod nginx[640]: upstream portainer responded in 112ms"),
      out("dim", "nov. 11 09:39:18 martylab-prod dockerd[512]: Container jellyfin started"),
      out("dim", "nov. 11 09:36:40 martylab-prod systemd[1]: Started Daily apt upgrade"),
    ],
    "ss -tulpn": [
      out("dim", "Netid State  Local Address:Port   Process"),
      out("", "tcp   LISTEN 0.0.0.0:22             sshd"),
      out("", "tcp   LISTEN 0.0.0.0:443            cloudflared"),
      out("", "tcp   LISTEN 127.0.0.1:3000         node"),
      out("", "tcp   LISTEN 127.0.0.1:5432         postgres"),
      out("", "tcp   LISTEN 127.0.0.1:8080         cloudflared"),
      out("", "tcp   LISTEN 172.17.0.2:8096        jellyfin"),
      out("", "tcp   LISTEN 172.17.0.4:2283        immich-server"),
    ],
    sensors: [
      out("dim", "Adapter: ISA adapter · coretemp-isa-0000"),
      out("", "Package id 0:  +48.0°C  (high = +80.0°C, crit = +100.0°C)"),
      out("", "Core 0:        +44.0°C  Core 5: +51.0°C"),
      out("", "Adapter: PCI adapter · nvme-pci-0100"),
      out("", "Composite:     +41.9°C  (crit = +84.8°C)"),
      out("dim", "Adapter: ACPI · thinkpad? non · boîtier"),
      out("", "fan1:          820 RPM   fan2: 1140 RPM   power: 96,0 W"),
    ],
    "uname -a": [
      out("", "Linux martylab-prod 6.12.38-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.12.38-1 (2026-10-02) x86_64 GNU/Linux"),
    ],
    "systemctl status martylab-backend": [
      out("accent", "● martylab-backend.service - Martylab backend"),
      out("", "     Loaded: loaded (/etc/systemd/system/martylab-backend.service; enabled)"),
      out("ok", "     Active: active (running) since Wed 2026-10-29 02:44:12 CEST; 12 days ago"),
      out("", "   Main PID: 812 (node) · Tasks: 14 · Memory: 1,2G"),
      out("dim", "      Logs: journalctl -u martylab-backend -n 50"),
    ],
  };

  const RISKY = {
    "docker restart jellyfin": "Redémarre le conteneur Jellyfin (coupure des lectures en cours).",
    "docker restart martylab-backend": "Redémarre le backend Martylab (API indisponible ~5 s).",
    "docker stop jellyfin": "Arrête Jellyfin jusqu’à la prochaine action manuelle.",
    "systemctl restart martylab-backend": "Redémarre le service backend Martylab.",
  };

  const services = (ML.CONTAINERS || []).map((c) => c.name);

  const history = [];
  let lastResult = null;

  function run(raw) {
    const command = String(raw || "").trim();
    if (!command) return { lines: [] };

    history.push(command);

    if (command === "clear") return { clear: true };

    if (RISKY[command]) {
      lastResult = null;
      return {
        echo: true,
        lines: [
          out("warn", "⚠ Action sensible : " + command),
          out("", "  " + RISKY[command]),
          out("dim", "  Confirme explicitement pour exécuter. La commande sera journalisée."),
        ],
        confirm: { command, reason: RISKY[command] },
      };
    }

    if (command.startsWith("docker restart ") || command.startsWith("docker stop ")) {
      const name = command.split(" ").slice(2).join(" ");
      return {
        echo: true,
        lines: [out("danger", "refusé · le service « " + name + " » n’est pas dans la liste des actions autorisées.")],
      };
    }

    if (command.startsWith("docker logs ")) {
      const name = command.slice("docker logs ".length).trim();
      if (!services.includes(name)) {
        return { echo: true, lines: [out("danger", "refusé · conteneur inconnu : " + name)] };
      }
      return {
        echo: true,
        lines: [
          out("dim", "2026-11-11T09:41:02Z  INFO   " + name + " | ready"),
          out("dim", "2026-11-11T09:41:03Z  INFO   " + name + " | healthcheck ok"),
          out("warn", "2026-11-11T09:38:11Z  WARN   " + name + " | latency above 50ms"),
          out("dim", "2026-11-11T09:30:00Z  INFO   " + name + " | request handled in 38ms"),
        ],
      };
    }

    if (OUTPUT[command]) {
      lastResult = { command, at: "09:42", status: "ok", ms: 12 };
      return { echo: true, lines: OUTPUT[command] };
    }

    return {
      echo: true,
      lines: [
        out("danger", "refusé · « " + command + " » n’est pas dans l’allowlist."),
        out("dim", "Tape « help » pour les commandes disponibles. Aucun shell libre n’est exposé."),
      ],
    };
  }

  function confirm(command) {
    lastResult = { command, at: "09:42", status: "confirmé", ms: 1840 };
    return [
      out("ok", "✔ action exécutée : " + command),
      out("dim", "  conteneur redémarré · healthcheck ok après 1,8 s"),
      out("dim", "  audit #A-2048 · conservé 90 jours"),
    ];
  }

  function cancel(command) {
    return [out("dim", "action annulée · aucune modification : " + command)];
  }

  function lineHTML(entry) {
    const cls = entry.cls ? " term__row--" + entry.cls : "";
    return `<div class="term__row${cls}">${esc(entry.text) || "&nbsp;"}</div>`;
  }

  function promptHTML(command) {
    return `<div class="term__row term__row--cmd"><span class="term__sig">alex@martylab-prod</span><span class="term__path">:~$</span> ${esc(command)}</div>`;
  }

  function initial() {
    const lines = HEADER.concat(OUTPUT["martylab status"]);
    return `<div class="term__row term__row--cmd"><span class="term__sig">alex@martylab-prod</span><span class="term__path">:~$</span> martylab status</div>${lines
      .map(lineHTML)
      .join("")}`;
  }

  const quick = [
    "martylab status",
    "docker ps",
    "df -h",
    "free -h",
    "uptime",
    "sensors",
    "journalctl -n 5",
    "ss -tulpn",
  ];

  ML.console = { run, confirm, cancel, lineHTML, promptHTML, initial, quick, history };

  ML.pages.console = {
    title: "Console",
    render() {
      const audit = [
        ["09:42", "alexandre", "martylab status", "ok", "12 ms"],
        ["09:38", "alexandre", "docker logs jellyfin", "ok", "9 ms"],
        ["09:31", "alexandre", "df -h", "ok", "7 ms"],
        ["23:40", "alexandre", "docker restart jellyfin", "confirmé", "1,8 s"],
        ["23:39", "alexandre", "docker stop portainer", "refusé", "—"],
      ];

      return `
        ${pagehead({
          eyebrow: "Infrastructure · session admin · 09:44",
          title: "Console",
          sub: "Un terminal contrôlé : commandes allowlistées, confirmation des actions sensibles et journal d’audit. Pas de shell libre, pas de sudo.",
          actions: `
            ${badge("allowlist · 11 commandes", "accent")}
            <button class="btn" data-toast="Nouvelle session ouverte (démonstration)">${icon("plus")} Nouvelle session</button>`,
        })}

        <div class="console-grid">
          <section class="panel term">
            <header class="term__bar">
              <span class="term__dots"><i></i><i></i><i></i></span>
              <span class="term__title">alex@martylab-prod — /srv/martylab</span>
              <span class="term__meta">zsh · utf-8</span>
              <button class="term__btn" data-console-clear aria-label="Effacer">${icon("trash-2")}</button>
            </header>

            <div class="term__body" data-console-out>
              ${ML.console.initial()}
            </div>

            <form class="term__form" data-console-form autocomplete="off">
              <span class="term__sig">alex@martylab-prod</span><span class="term__path">:~$</span>
              <input class="term__input" data-console-input spellcheck="false" aria-label="Commande" placeholder="help" autocomplete="off">
              <button class="term__send" type="submit" aria-label="Exécuter">${icon("send")}</button>
            </form>

            <footer class="term__foot">
              <span class="term__hint-kb">↑ historique</span><span class="term__hint-kb">Tab complète</span><span class="term__hint-kb">Ctrl+L efface</span>
              <span class="term__hint-touch">↔ défiler</span>
              <span class="grow"></span>
              <span>${icon("shield")} session auditée</span>
            </footer>
          </section>

          <aside class="stack">
            <section class="panel">
              <div class="panel__head"><span class="panel__title">${icon("terminal")} Commandes</span><span class="panel__hint">lecture</span></div>
              <div class="cmdlist">
                ${quick
                  .map(
                    (c) => `<button class="cmditem" data-console-cmd="${c}">
                      ${icon("chevron-right")}<span class="mono">${c}</span>
                    </button>`,
                  )
                  .join("")}
              </div>
              <div class="panel__head" style="margin-top:12px"><span class="panel__title">${icon("triangle-alert")} Actions</span><span class="panel__hint">confirmation</span></div>
              <div class="cmdlist">
                <button class="cmditem cmditem--warn" data-console-cmd="docker restart jellyfin">
                  ${icon("rotate-ccw")}<span class="mono">docker restart jellyfin</span>${badge("risque", "warn")}
                </button>
                <button class="cmditem cmditem--warn" data-console-cmd="systemctl restart martylab-backend">
                  ${icon("rotate-ccw")}<span class="mono">systemctl restart backend</span>${badge("risque", "warn")}
                </button>
              </div>
            </section>

            <section class="panel">
              <div class="panel__head"><span class="panel__title">${icon("shield")} Politique</span>${badge("strict", "ok")}</div>
              <div class="kvrow"><span class="kvrow__k">Allowlist</span><span class="kvrow__v mono">11 commandes</span></div>
              <div class="kvrow"><span class="kvrow__k">Shell libre</span><span class="kvrow__v mono">non</span></div>
              <div class="kvrow"><span class="kvrow__k">sudo / élévation</span><span class="kvrow__v mono">non</span></div>
              <div class="kvrow"><span class="kvrow__k">Conteneurs ciblés</span><span class="kvrow__v mono">10 connus</span></div>
              <div class="kvrow"><span class="kvrow__k">Audit</span><span class="kvrow__v mono">oui · 90 j</span></div>
              <div class="kvrow"><span class="kvrow__k">Rôles</span><span class="kvrow__v mono">admin · user</span></div>
              <p class="tiny" style="line-height:1.5;margin:10px 0 0">Le rôle invité n’a pas accès à la console. Chaque commande est vérifiée côté serveur, jamais dans le navigateur.</p>
            </section>

            <section class="panel">
              <div class="panel__head"><span class="panel__title">${icon("clock")} Session</span><span class="panel__hint">#S-1042</span></div>
              <div class="kvrow"><span class="kvrow__k">Utilisateur</span><span class="kvrow__v mono">alexandre</span></div>
              <div class="kvrow"><span class="kvrow__k">Rôle</span><span class="kvrow__v mono">admin</span></div>
              <div class="kvrow"><span class="kvrow__k">Depuis</span><span class="kvrow__v mono">09:44</span></div>
              <div class="kvrow"><span class="kvrow__k">Expire</span><span class="kvrow__v mono">10:14</span></div>
              <div class="kvrow"><span class="kvrow__k">Origine</span><span class="kvrow__v mono">martylab.fr</span></div>
            </section>
          </aside>
        </div>

        <section class="panel panel--flush section">
          <div class="panel__head" style="padding:14px 16px 12px;margin:0">
            <span class="panel__title">${icon("history")} Journal d’audit</span>
            <span class="panel__hint">5 entrées · rétention 90 jours</span>
          </div>
          <div class="tblwrap">
            <table class="tbl">
              <thead><tr><th>Heure</th><th>Utilisateur</th><th>Commande</th><th>Résultat</th><th>Durée</th></tr></thead>
              <tbody data-audit-body>
                ${audit
                  .map(
                    (a) => `<tr>
                      <td data-label="Heure"><span class="mono small">${a[0]}</span></td>
                      <td data-label="Utilisateur"><span class="small">${a[1]}</span></td>
                      <td data-label="Commande"><span class="mono small">${a[2]}</span></td>
                      <td data-label="Résultat">${badge(a[3], a[3] === "ok" ? "ok" : a[3] === "confirmé" ? "warn" : "danger")}</td>
                      <td data-label="Durée"><span class="mono small">${a[4]}</span></td>
                    </tr>`,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          <p class="tiny" style="padding:0 16px 14px">Même refusée, une commande est journalisée. Les secrets et variables d’environnement ne sont jamais affichés.</p>
        </section>
      `;
    },
  };
})(window.ML);
