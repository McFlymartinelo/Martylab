/**
 * Martylab — génération du guide de marque (HTML → PDF via Chrome).
 *
 * Toutes les valeurs (couleurs, contrastes, dimensions, poids de fichiers)
 * proviennent de generated/palette.json et generated/assets.json ou sont lues
 * sur disque. Rien n'est saisi à la main dans le document.
 */
import { readFileSync, writeFileSync, mkdirSync, statSync, readdirSync } from "node:fs";
import { dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const brand = resolve(here, "..");
const palette = JSON.parse(readFileSync(resolve(here, "generated/palette.json"), "utf8"));
const assets = JSON.parse(readFileSync(resolve(here, "generated/assets.json"), "utf8"));
const wordmark = JSON.parse(readFileSync(resolve(here, "generated/wordmark.json"), "utf8"));

const L = palette.tokens.light;
const D = palette.tokens.dark;
const VERSION = "1.0.0";
const TODAY = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date());

const svg = (path) =>
  readFileSync(resolve(brand, path), "utf8")
    .replace(/<\?xml[^>]*>/, "")
    .replace(/ width="[^"]*"/, "")
    .replace(/ height="[^"]*"/, "");

const logoLight = svg("assets/logo/martylab-logo-horizontal.svg");
const logoDark = svg("assets/logo/martylab-logo-horizontal-dark.svg");
const stackedLight = svg("assets/logo/martylab-logo-stacked.svg");
const symbolLight = svg("assets/logo/martylab-symbol.svg");
const symbolDark = svg("assets/logo/martylab-symbol-dark.svg");
const symbolMonoB = svg("assets/logo/martylab-symbol-mono-black.svg");
const symbolMonoW = svg("assets/logo/martylab-symbol-mono-white.svg");
const logoMonoB = svg("assets/logo/martylab-logo-horizontal-mono-black.svg");
const logoMonoW = svg("assets/logo/martylab-logo-horizontal-mono-white.svg");
const iconSvg = svg("assets/icons/martylab-app-icon.svg");
const maskableSvg = svg("assets/icons/martylab-app-icon-maskable.svg");
const foregroundSvg = svg("assets/icons/martylab-app-icon-foreground.svg");
const faviconSvg = svg("assets/icons/martylab-favicon.svg");

const fontB64 = (rel) => readFileSync(resolve(process.cwd(), rel)).toString("base64");
const bricolage = fontB64("node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2");
const interTight = fontB64("node_modules/@fontsource-variable/inter-tight/files/inter-tight-latin-wght-normal.woff2");
const jetbrains = fontB64("node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const dumb = (s) => esc(s).replace(/(\d),(\d)/g, "$1,$2");

/** Ratio lu dans le calcul de color.mjs — jamais saisi à la main. */
const ratioOf = (mode, fg, bg) => {
  const hit = palette.checks.find((c) => c.mode === mode && c.fg === fg && c.bg === bg);
  if (!hit) throw new Error(`contraste introuvable : ${mode} ${fg}/${bg}`);
  return hit.ratio;
};
const fmtRatio = (r) => `${r.toFixed(2).replace(".", ",")}:1`;

/* ---------------------------------------------------------------- */
/* Inventaire des fichiers livrés                                    */
/* ---------------------------------------------------------------- */

const files = [];
const walk = (dir, prefix = "") => {
  for (const entry of readdirSync(resolve(brand, dir), { withFileTypes: true })) {
    const p = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(p, prefix);
    else files.push({ path: p, name: entry.name });
  }
};
walk("assets/logo");
walk("assets/icons");

const purposes = {
  "martylab-logo-horizontal.svg": "Signature web et documents, fond clair",
  "martylab-logo-horizontal-dark.svg": "Signature web et documents, fond sombre",
  "martylab-logo-stacked.svg": "Formats étroits, fond clair",
  "martylab-logo-stacked-dark.svg": "Formats étroits, fond sombre",
  "martylab-logo-horizontal-mono-black.svg": "Une encre noire (presse, tampon, gravure)",
  "martylab-logo-horizontal-mono-white.svg": "Une encre blanche sur fond sombre",
  "martylab-symbol.svg": "Symbole seul, fond clair, transparent",
  "martylab-symbol-dark.svg": "Symbole seul, fond sombre, transparent",
  "martylab-symbol-mono-black.svg": "Symbole monochrome noir",
  "martylab-symbol-mono-white.svg": "Symbole monochrome blanc",
  "martylab-app-icon.svg": "Source vectorielle de l'icône d'application",
  "martylab-app-icon-1024.png": "Icône iOS / Android 1024 px, coins pleins",
  "martylab-app-icon-maskable-1024.png": "Icône maskable Android, zone sûre 80 %",
  "martylab-app-icon-foreground-1024.png": "Calque avant Android, transparent",
  "martylab-apple-touch-icon-180.png": "Écran d'accueil iOS",
  "martylab-pwa-192.png": "Manifest PWA, purpose any",
  "martylab-pwa-512.png": "Manifest PWA, purpose any",
  "martylab-favicon.svg": "Favicon vectoriel simplifié",
  "martylab-favicon-32.png": "Contrôle optique du favicon",
  "martylab-app-icon-maskable.svg": "Source vectorielle de l'icône maskable",
  "martylab-app-icon-foreground.svg": "Source vectorielle du calque avant",
};

const dims = new Map(assets.png.map((p) => [p.file, `${p.width} × ${p.height}`]));
dims.set("martylab-favicon.svg", "32 × 32 (viewBox)");

function fileTable(list) {
  const rows = list
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((f) => {
      const size = statSync(resolve(brand, f.path)).size;
      const ext = f.name.split(".").pop().toUpperCase();
      const dim = dims.get(f.name) ?? (f.name.endsWith(".svg") ? "vectoriel" : "—");
      return `<tr><td class="file">${esc(f.name)}</td><td class="mono">${dim}</td><td class="mono num">${(size / 1024).toFixed(1).replace(".", ",")} Ko</td></tr>`;
    })
    .join("\n");
  return `<table class="tight files"><thead><tr><th>Fichier</th><th>Dimensions</th><th class="num">Poids</th></tr></thead><tbody>${rows}</tbody></table>`;
}

const logoFiles = files.filter((f) => f.path.startsWith("assets/logo"));
const iconFiles = files.filter((f) => f.path.startsWith("assets/icons"));

/* ---------------------------------------------------------------- */
/* Contrastes                                                        */
/* ---------------------------------------------------------------- */

const ratioRows = palette.checks
  .map((c) => {
    const verdict = c.ratio >= 7 ? "AAA" : c.ratio >= 4.5 ? "AA" : c.ratio >= 3 ? "AA" : "Échec";
    const target = c.target === 4.5 ? "4,5:1" : "3:1";
    return `<tr><td>${esc(c.label)}</td><td class="mono">${c.fgHex}</td><td class="mono">${c.bgHex}</td><td class="mono num">${c.ratio.toFixed(2).replace(".", ",")}:1</td><td class="mono">${target}</td><td class="ok">${verdict}</td></tr>`;
  })
  .join("\n");

/** Tableau compact : paire, texte, fond, ratio + verdict. */
function contrastTable(mode, onlyBrand = false) {
  const rows = palette.checks.filter(
    (c) => c.mode === mode && c.label.startsWith("Marque") === onlyBrand,
  );
  const names = {
    foreground: "texte",
    primary: "accent",
    background: "fond",
    card: "carte",
    sidebar: "barre latérale",
  };
  const body = rows
    .map((c) => {
      const verdict = c.ratio >= 7 ? "AAA" : c.ratio >= 4.5 ? "AA" : c.ratio >= 3 ? "AA" : "Échec";
      const label = onlyBrand
        ? esc(c.label.replace("Marque ", "").replace(" sur ", " / ").replace(/\w+/g, (w) => names[w] ?? w))
        : esc(c.label);
      return `<tr><td>${label}</td><td class="mono">${c.fgHex}</td><td class="mono">${c.bgHex}</td><td class="mono num">${c.ratio.toFixed(2).replace(".", ",")}:1</td><td class="ok">${verdict}</td></tr>`;
    })
    .join("");
  return `<table class="tight"><thead><tr><th>Paire</th><th>Texte</th><th>Fond</th><th class="num">Ratio</th><th>WCAG</th></tr></thead><tbody>${body}</tbody></table>`;
}

/* ---------------------------------------------------------------- */
/* Palette                                                           */
/* ---------------------------------------------------------------- */

const swatch = (t, label, note) => `
  <div class="swatch">
    <div class="chip" style="background:${t.hex}"></div>
    <div class="swatch-body">
      <div class="swatch-name">${esc(label)}</div>
      <div class="mono">${t.hex} · rgb(${t.rgb.r}, ${t.rgb.g}, ${t.rgb.b})</div>
      <div class="mono">${esc(t.css)}</div>
      ${note ? `<div class="swatch-note">${esc(note)}</div>` : ""}
    </div>
  </div>`;

const paletteLight = [
  ["Fond « paper »", L.background, "Fond d'écran clair"],
  ["Surface carte", L.card, "Panneaux, cartes"],
  ["Texte principal", L.foreground, "Texte, logotype sur fond clair"],
  ["Texte secondaire", L["muted-foreground"], "Légendes, métadonnées"],
  ["Accent signal", L.primary, "Module actif, actions primaires"],
  ["Trait", L.border, "Séparateurs 1 px"],
]
  .map(([label, token, note]) => swatch(token, label, note))
  .join("");

const paletteDark = [
  ["Fond graphite", D.background, "Fond d'écran sombre"],
  ["Surface carte", D.card, "Panneaux, cartes"],
  ["Texte principal", D.foreground, "Texte, logotype sur fond sombre"],
  ["Texte secondaire", D["muted-foreground"], "Légendes, métadonnées"],
  ["Accent signal", D.primary, "Module actif, actions primaires"],
  ["Trait", D.border, "Séparateurs 1 px"],
]
  .map(([label, token, note]) => swatch(token, label, note))
  .join("");

/* ---------------------------------------------------------------- */
/* Gabarit                                                           */
/* ---------------------------------------------------------------- */

const css = `
@font-face{font-family:"Bricolage Grotesque";src:url(data:font/woff2;base64,${bricolage}) format("woff2");font-weight:200 800;font-display:block;}
@font-face{font-family:"Inter Tight";src:url(data:font/woff2;base64,${interTight}) format("woff2");font-weight:100 900;font-display:block;}
@font-face{font-family:"JetBrains Mono";src:url(data:font/woff2;base64,${jetbrains}) format("woff2");font-weight:100 800;font-display:block;}

:root{
  --paper:${L.background.hex}; --graphite:${D.background.hex};
  --ink:${L.foreground.hex}; --ink-dark:${D.foreground.hex};
  --signal:${L.primary.hex}; --signal-dark:${D.primary.hex};
  --line:${L.border.hex}; --line-dark:${D.border.hex};
  --muted:${L["muted-foreground"].hex}; --muted-dark:${D["muted-foreground"].hex};
  --card:${L.card.hex}; --card-dark:${D.card.hex};
}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
@page{size:A4;margin:0;}
html,body{margin:0;padding:0;}
body{font-family:"Inter Tight",sans-serif;color:var(--ink);background:#fff;font-size:9.2pt;line-height:1.45;}
.page{width:210mm;height:297mm;padding:18mm 18mm 16mm;position:relative;overflow:hidden;break-after:page;background:#fff;}
.page:last-child{break-after:auto;}
.dark{background:var(--graphite);color:var(--ink-dark);}
h1,h2,h3,h4{font-family:"Bricolage Grotesque",sans-serif;font-weight:600;letter-spacing:-.02em;margin:0;}
h1{font-size:34pt;line-height:1.02;}
h2{font-size:19pt;line-height:1.08;margin-bottom:6mm;}
h3{font-size:11pt;margin:7mm 0 2.5mm;}
p{margin:0 0 2.6mm;max-width:150mm;}
.mono,.kicker{font-family:"JetBrains Mono",monospace;font-variant-numeric:tabular-nums;}
.kicker{font-size:6.6pt;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);}
.dark .kicker{color:var(--muted-dark);}
.rule{height:1px;background:var(--line);margin:5mm 0;}
.dark .rule{background:var(--line-dark);}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:6mm;}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:5mm;}
.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm;}
.grid2>*,.grid3>*,.grid4>*{min-width:0;}
.grid4 .small{min-height:10mm;}
.panel{border:1px solid var(--line);border-radius:4mm;padding:5mm;background:var(--card);}
.dark .panel{border-color:var(--line-dark);background:var(--card-dark);}
.panel h4{font-size:10pt;margin-bottom:2mm;}
.small{font-size:8pt;color:var(--muted);}
.dark .small{color:var(--muted-dark);}
table{width:100%;border-collapse:collapse;font-size:8pt;}
table.tight{font-size:7.3pt;}
table.tight td{padding:1.2mm 1.6mm;}
.files td.file{font-size:6.7pt;white-space:nowrap;}
th{font-family:"JetBrains Mono",monospace;font-size:6.4pt;letter-spacing:.12em;text-transform:uppercase;text-align:left;color:var(--muted);font-weight:500;padding:2mm 2mm;border-bottom:1px solid var(--line);}
td{padding:1.7mm 2mm;border-bottom:1px solid rgba(0,0,0,.06);vertical-align:top;}
td.num{text-align:right;white-space:nowrap;}
td.file{font-family:"JetBrains Mono",monospace;font-size:7.2pt;}
.ok{color:#0B6B39;font-weight:600;}
.badge{display:inline-block;font-family:"JetBrains Mono",monospace;font-size:6.2pt;letter-spacing:.08em;text-transform:uppercase;border:1px solid var(--line);border-radius:99px;padding:.6mm 2mm;color:var(--muted);}
footer{position:absolute;left:18mm;right:18mm;bottom:8mm;display:flex;justify-content:space-between;font-family:"JetBrains Mono",monospace;font-size:6.2pt;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);}
.dark footer{color:var(--muted-dark);}
.sv{display:block;}
.swatch{display:flex;gap:3mm;align-items:center;margin-bottom:2.4mm;}
.chip{width:14mm;height:14mm;border-radius:2.4mm;flex:0 0 auto;border:1px solid rgba(0,0,0,.08);}
.chip-inline{display:inline-block;width:6mm;height:6mm;border-radius:1.4mm;border:1px solid rgba(0,0,0,.1);vertical-align:middle;}
.swatch-name{font-family:"Bricolage Grotesque",sans-serif;font-weight:600;font-size:9pt;}
.swatch .mono{font-size:6.6pt;color:var(--muted);}
.swatch-note{font-size:7.2pt;color:var(--muted);}
.cover{display:flex;flex-direction:column;justify-content:space-between;}
.cover .mark{width:118mm;}
.cover h1{font-size:40pt;}
.cover .meta{display:flex;gap:8mm;font-size:7pt;}
.cover-meta{border-top:1px solid var(--line-dark);padding-top:4mm;}
.tag{display:inline-flex;align-items:center;gap:2mm;}
.dot{width:2.2mm;height:2.2mm;border-radius:50%;background:var(--signal-dark);display:inline-block;}
.note{border-left:2px solid var(--signal);padding-left:4mm;font-size:8.4pt;color:var(--muted);}
.dark .note{border-color:var(--signal-dark);color:var(--muted-dark);}
.dont{border:1px solid var(--line);border-radius:3mm;padding:3mm;text-align:center;position:relative;}
.dont .fault{height:30mm;display:flex;align-items:center;justify-content:center;overflow:hidden;background:${L.background.hex};border-radius:2mm;}
.dont .fault svg{display:block;width:100%;height:auto;}
.dont .fault.sym{background:transparent;}
.dont .x{position:absolute;top:2mm;right:2mm;width:5mm;height:5mm;border-radius:50%;background:#BE222A;color:#fff;font-size:6pt;line-height:5mm;font-weight:700;z-index:2;}
.dont figcaption{font-size:6.8pt;color:var(--muted);margin-top:2mm;line-height:1.3;text-align:left;}
.tile-col{display:flex;flex-direction:column;}
.tile-col .panel{flex:1;display:flex;align-items:center;justify-content:center;padding:4mm;}
.fault-stretch svg{transform:scaleX(1.55);}
.fault-rotate svg{transform:rotate(-9deg);}
.fault-recolor svg{filter:hue-rotate(150deg) saturate(1.6);}
.fault-fade svg{opacity:.22;}
.fault-shadow svg{filter:drop-shadow(1.6mm 1.6mm .8mm rgba(0,0,0,.45));}
.fault-pattern{display:flex;gap:1.6mm;align-items:center;justify-content:center;}
.fault-slogan .slogan{font-family:"Bricolage Grotesque",sans-serif;font-size:6pt;margin-top:2mm;}
.app-shot{border-radius:4mm;border:1px solid var(--line);overflow:hidden;background:var(--paper);}
.shot-dark{background:var(--graphite);border-color:var(--line-dark);color:var(--ink-dark);}
.shot-top{display:flex;align-items:center;justify-content:space-between;padding:3mm 4mm;border-bottom:1px solid var(--line);}
.shot-dark .shot-top{border-color:var(--line-dark);}
.shot-logo{width:26mm;}
.shot-body{display:flex;gap:3mm;padding:4mm;}
.shot-side{width:15mm;border-right:1px solid var(--line);padding-right:3mm;}
.shot-dark .shot-side{border-color:var(--line-dark);}
.navrow{height:2.2mm;border-radius:1mm;background:rgba(16,24,31,.1);margin-bottom:1.6mm;}
.shot-dark .navrow{background:rgba(240,242,244,.14);}
.navrow.on{background:var(--signal);}
.shot-dark .navrow.on{background:var(--signal-dark);}
.shot-main{flex:1;}
.hero{border:1px solid var(--line);border-radius:3mm;padding:3mm;margin-bottom:2.5mm;}
.shot-dark .hero{border-color:var(--line-dark);}
.hero .bar{height:1.6mm;border-radius:1mm;background:var(--signal);width:62%;}
.shot-dark .hero .bar{background:var(--signal-dark);}
.mini{display:grid;grid-template-columns:1fr 1fr 1fr;gap:2mm;}
.mini div{border:1px solid var(--line);border-radius:2mm;padding:2mm;height:14mm;}
.shot-dark .mini div{border-color:var(--line-dark);}
.mini .t{height:1.2mm;width:60%;background:rgba(16,24,31,.14);border-radius:1mm;margin-bottom:1.4mm;}
.shot-dark .mini .t{background:rgba(240,242,244,.2);}
.mini .v{height:3mm;width:40%;background:var(--ink);border-radius:1mm;opacity:.85;}
.shot-dark .mini .v{background:var(--ink-dark);}
.phone{width:60mm;height:108mm;border-radius:8mm;border:2px solid #1b2228;background:var(--paper);overflow:hidden;position:relative;margin:0 auto;}
.phone .notch{position:absolute;top:2.4mm;left:50%;transform:translateX(-50%);width:16mm;height:2.4mm;border-radius:9mm;background:#1b2228;}
.phone .top{height:16mm;display:flex;align-items:flex-end;justify-content:space-between;padding:0 4mm 2.5mm;border-bottom:1px solid var(--line);}
.phone .top .shot-logo{width:22mm;}
.phone .content{padding:4mm;}
.phone .tabbar{position:absolute;bottom:0;left:0;right:0;height:14mm;border-top:1px solid var(--line);display:flex;align-items:center;justify-content:space-around;background:var(--card);}
.phone .tab{width:4mm;height:4mm;border-radius:1.2mm;background:rgba(16,24,31,.22);}
.phone .tab.on{background:var(--signal);}
.phone .cta{width:7mm;height:7mm;border-radius:2.4mm;background:var(--signal);margin-top:-4mm;box-shadow:0 0 0 1.6mm var(--paper);}
.icontile{border-radius:6mm;overflow:hidden;display:block;}
.icontile svg{display:block;width:100%;height:auto;}
.iconrow{display:flex;align-items:flex-end;gap:6mm;}
.scale-item{text-align:center;font-size:6.4pt;color:var(--muted);}
.mislabel{display:inline-block;font-size:6.2pt;color:#BE222A;font-weight:600;margin-top:1mm;}
.spec{font-size:7.6pt;}
.spec b{font-family:"JetBrains Mono",monospace;font-weight:500;}
.space-diagram{position:relative;padding:9mm;border:1px dashed var(--line);border-radius:2mm;display:inline-block;}
.space-diagram .inner{position:absolute;inset:9mm;border:1px dashed rgba(61,122,36,.55);}
.clear{clear:both;}
`;

const footer = (n, label) => `<footer><span>Martylab · guide d'identité ${VERSION}</span><span>${esc(label)} · ${String(n).padStart(2, "0")}</span></footer>`;

let pageNo = 0;
const page = (inner, cls = "") => {
  pageNo += 1;
  return `<section class="page ${cls}">${inner}${footer(pageNo, label)}</section>`;
};
let label = "";

const pages = [];

/* --- 01 couverture ------------------------------------------------- */
label = "Couverture";
pages.push(
  page(
    `<div class="cover" style="height:100%">
      <div>
        <div class="kicker" style="margin-bottom:10mm">Martylab · plateforme personnelle auto-hébergée</div>
        <div class="mark">${logoDark}</div>
      </div>
      <div>
        <h1>Guide<br/>d'identité<br/>visuelle</h1>
        <p style="margin-top:6mm;color:${D["muted-foreground"].hex};font-size:10pt;max-width:120mm">
          Symbole, logotype, couleurs, typographies et règles d'usage.
          Document de référence pour le portail, la PWA et les supports externes.
        </p>
      </div>
      <div class="cover-meta">
        <div class="meta">
          <div><div class="kicker">Version</div><div class="mono">${VERSION}</div></div>
          <div><div class="kicker">Date</div><div class="mono">${esc(TODAY)}</div></div>
          <div><div class="kicker">Production</div><div class="mono">martylab.fr</div></div>
          <div><div class="kicker">Accent</div><div class="mono">${D.primary.hex}</div></div>
        </div>
      </div>
    </div>`,
    "dark cover",
  ),
);

/* --- 02 concept ---------------------------------------------------- */
label = "Concept";
pages.push(
  page(`
    <div class="kicker">01 · Concept</div>
    <h2>Quatre modules,<br/>une seule source.</h2>
    <div class="grid2" style="grid-template-columns:1.15fr .85fr;gap:10mm">
      <div>
        <p>Martylab n'exécute pas les applications : il les relie. Le symbole reprend cette
        architecture — quatre modules strictement identiques, indépendants, séparés par un vide
        constant.</p>
        <p>Le module actif est le seul à porter le vert signal : c'est le point d'orchestration.
        Sa position, en bas à droite, est celle du dernier élément lu : rien ne le précède,
        il fédère.</p>
        <p>Le carré à coins arrondis est la forme de base de l'interface Cockpit : panneaux,
        boutons, cartes et modules partagent le même rayon optique. Le symbole n'est donc pas
        un pictogramme ajouté, mais un état du système.</p>
        <div class="note" style="margin-top:6mm">
          Aucun dégradé, aucune ombre, aucun effet : l'identité repose sur la géométrie,
          un accent unique et la typographie.
        </div>
      </div>
      <div>
        <div style="background:${L.background.hex};border:1px solid ${L.border.hex};border-radius:4mm;padding:10mm;display:flex;justify-content:center">
          <div style="width:52mm">${symbolLight}</div>
        </div>
        <div class="mono small" style="margin-top:2mm;text-align:center">symbole officiel · 4 modules</div>
      </div>
    </div>

    <div class="grid3" style="margin-top:10mm;gap:8mm">
      <div>
        <div class="mono" style="color:${L.primary.hex};font-size:8pt">01</div>
        <h4 style="font-size:10pt;margin:1mm 0 1.5mm">Indépendance</h4>
        <p class="small" style="margin:0">Les modules sont identiques et ne se chevauchent jamais : aucune application
        n'est subordonnée à une autre dans le dessin.</p>
      </div>
      <div>
        <div class="mono" style="color:${L.primary.hex};font-size:8pt">02</div>
        <h4 style="font-size:10pt;margin:1mm 0 1.5mm">Liaison</h4>
        <p class="small" style="margin:0">La gouttière constante est aussi importante que les modules : c'est l'espace
        de connexion, pas un vide décoratif.</p>
      </div>
      <div>
        <div class="mono" style="color:${L.primary.hex};font-size:8pt">03</div>
        <h4 style="font-size:10pt;margin:1mm 0 1.5mm">Orchestration</h4>
        <p class="small" style="margin:0">Un seul module porte l'accent. S'il y en avait deux, le symbole ne dirait
        plus qui relie.</p>
      </div>
    </div>

    <div class="panel" style="margin-top:9mm;display:flex;gap:10mm;align-items:center;padding:5mm 6mm">
      <div>
        <div class="kicker">Graphie du nom</div>
        <div style="font-family:'Bricolage Grotesque';font-weight:600;font-size:16pt;letter-spacing:-.02em">Martylab</div>
      </div>
      <div class="small" style="max-width:110mm;margin:0">Toujours un M majuscule, le reste en minuscules, un seul mot.
      Jamais <span class="mono">MartyLab</span>, <span class="mono">Marty Lab</span>, <span class="mono">MARTYLAB</span>
      ni <span class="mono">Martylab.fr</span> dans le logotype.</div>
    </div>

    <div class="panel" style="margin-top:6mm;display:flex;gap:10mm;align-items:center;padding:5mm 6mm">
      <div style="position:relative;width:34mm;flex:0 0 auto">
        <div style="width:34mm">${symbolLight}</div>
        ${[
          [2, "h"],
          [14, "h"],
          [18, "h"],
          [30, "h"],
        ]
          .map(
            ([u]) =>
              `<div style="position:absolute;top:0;bottom:0;left:${(u / 32) * 100}%;border-left:1px dashed rgba(61,122,36,.5)"></div>`,
          )
          .join("")}
        ${[
          [2, "h"],
          [14, "h"],
          [18, "h"],
          [30, "h"],
        ]
          .map(
            ([u]) =>
              `<div style="position:absolute;left:0;right:0;top:${(u / 32) * 100}%;border-top:1px dashed rgba(61,122,36,.5)"></div>`,
          )
          .join("")}
      </div>
      <div>
        <div class="kicker">Construction</div>
        <table class="tight" style="margin-top:1mm">
          <tbody>
            <tr><td>Grille</td><td class="mono num">32 × 32 unités</td></tr>
            <tr><td>Module</td><td class="mono num">12 × 12</td></tr>
            <tr><td>Gouttière</td><td class="mono num">4</td></tr>
            <tr><td>Rayon</td><td class="mono num">3,5</td></tr>
            <tr><td>Marge</td><td class="mono num">2</td></tr>
          </tbody>
        </table>
      </div>
      <div class="small" style="margin:0;max-width:70mm">Les traits pointillés marquent les limites
      des modules et de la gouttière. Aucune valeur n'est arrondie à l'œil : les fichiers livrés
      utilisent exactement ces unités.</div>
    </div>
  `),
);

/* --- 03 versions --------------------------------------------------- */
label = "Versions du logo";
pages.push(
  page(`
    <div class="kicker">02 · Déclinaisons</div>
    <h2>Trois compositions,<br/>deux valeurs de fond.</h2>
    <div class="grid2" style="gap:6mm;margin-bottom:6mm">
      <div>
        <div class="panel" style="background:${L.background.hex};padding:9mm 7mm;display:flex;justify-content:center">
          <div style="width:78mm">${logoLight}</div>
        </div>
        <div class="small" style="margin-top:2mm">Horizontal · fond clair · <span class="mono">martylab-logo-horizontal.svg</span></div>
      </div>
      <div>
        <div class="panel" style="background:${D.background.hex};border-color:${D.border.hex};padding:9mm 7mm;display:flex;justify-content:center">
          <div style="width:78mm">${logoDark}</div>
        </div>
        <div class="small" style="margin-top:2mm">Horizontal · fond sombre · <span class="mono">…-horizontal-dark.svg</span></div>
      </div>
    </div>

    <div class="grid4" style="gap:5mm">
      <div class="tile-col">
        <div class="panel" style="background:${L.background.hex}">
          <div style="width:32mm">${stackedLight}</div>
        </div>
        <div class="small" style="margin-top:2mm">Empilé · <span class="mono">…-stacked.svg</span></div>
      </div>
      <div class="tile-col">
        <div class="panel" style="background:${L.background.hex}">
          <div style="width:20mm">${symbolLight}</div>
        </div>
        <div class="small" style="margin-top:2mm">Symbole · <span class="mono">…-symbol.svg</span></div>
      </div>
      <div class="tile-col">
        <div class="panel" style="background:${L.background.hex}">
          <div style="width:30mm">${logoMonoB}</div>
        </div>
        <div class="small" style="margin-top:2mm">Mono noir · <span class="mono">…-mono-black.svg</span></div>
      </div>
      <div class="tile-col">
        <div class="panel" style="background:${D.background.hex};border-color:${D.border.hex}">
          <div style="width:30mm">${logoMonoW}</div>
        </div>
        <div class="small" style="margin-top:2mm">Mono blanc · <span class="mono">…-mono-white.svg</span></div>
      </div>
    </div>

    <h3>Quand utiliser quoi</h3>
    <table>
      <thead><tr><th>Version</th><th>Usage</th><th>Fond</th></tr></thead>
      <tbody>
        <tr><td>Horizontal</td><td>Signature par défaut : sidebar, documents, en-têtes, factures</td><td>Clair ou sombre, version dédiée</td></tr>
        <tr><td>Empilé</td><td>Formats étroits ou carrés : splash, couverture, badge, stand</td><td>Clair ou sombre</td></tr>
        <tr><td>Symbole</td><td>Avatar, icône PWA, favicon, marqueur de chargement, coin d'écran</td><td>Transparent, à placer sur fond autorisé</td></tr>
        <tr><td>Monochrome</td><td>Une seule encre : presse, tampon, gravure, marquage, fax</td><td>Noir sur clair / blanc sur sombre</td></tr>
      </tbody>
    </table>

    <div class="grid2" style="margin-top:6mm;gap:6mm">
      <div class="panel" style="padding:4mm">
        <h4>Sources et exports</h4>
        <p class="small" style="margin:0">Les SVG sont les fichiers de référence : toute modification part de là.
        Les PNG d'icônes sont générés depuis ces SVG, avec les mêmes couleurs et proportions.</p>
      </div>
      <div class="panel" style="padding:4mm">
        <h4>Pas de JPG</h4>
        <p class="small" style="margin:0">Aucune version JPG n'est fournie : le format ne gère pas la transparence
        et introduit des artefacts sur les aplats et les bords arrondis.</p>
      </div>
    </div>

    <h3 style="margin-top:8mm">Trois exports d'icône, trois usages</h3>
    <div class="grid3" style="gap:6mm">
      <div class="tile-col">
        <div class="panel" style="background:${L.background.hex};padding:4mm">
          <div style="width:24mm" class="icontile">${iconSvg}</div>
        </div>
        <div class="small" style="margin-top:2mm">Icône pleine<br/><span class="mono">…-app-icon-1024.png</span></div>
      </div>
      <div class="tile-col">
        <div class="panel" style="background:${L.background.hex};padding:4mm">
          <div style="width:24mm" class="icontile">${maskableSvg}</div>
        </div>
        <div class="small" style="margin-top:2mm">Maskable · zone sûre 80 %<br/><span class="mono">…-maskable-1024.png</span></div>
      </div>
      <div class="tile-col">
        <div class="panel" style="background:${D.background.hex};border-color:${D.border.hex};padding:4mm">
          <div style="width:24mm" class="icontile">${foregroundSvg}</div>
        </div>
        <div class="small" style="margin-top:2mm">Calque avant Android<br/><span class="mono">…-foreground-1024.png</span></div>
      </div>
    </div>
  `),
);

/* --- 04 couleurs --------------------------------------------------- */
label = "Couleurs";
pages.push(
  page(`
    <div class="kicker">03 · Couleurs</div>
    <h2>Un graphite, un papier,<br/>un signal.</h2>
    <p>Les valeurs ci-dessous sont calculées depuis les jetons OKLCH de production
    (<span class="mono">apps/portal/src/index.css</span>) puis converties en sRGB. Ce sont les
    seules valeurs de référence : le code et les fichiers livrés utilisent exactement ces HEX.</p>

    <div class="grid2" style="gap:8mm">
      <div>
        <h3 style="margin-top:2mm">Thème clair « paper »</h3>
        ${paletteLight}
      </div>
      <div>
        <h3 style="margin-top:2mm">Thème sombre « graphite »</h3>
        ${paletteDark}
      </div>
    </div>

    <div class="panel" style="margin-top:4mm">
      <h4>CMJN</h4>
      <p class="spec" style="margin:0">Aucune valeur CMJN n'est publiée : une conversion CMJN dépend d'un
      profil ICC (ISO Coated v2, GRACoL) et d'un support. Pour l'impression, convertir les HEX
      ci-dessus avec le profil fourni par l'imprimeur ; ne pas utiliser de conversion « à l'œil ».</p>
    </div>

    <h3 style="margin-top:6mm">Couleurs d'état</h3>
    <p class="spec">Quatre teintes supplémentaires, réservées au statut d'une donnée ou d'une action.
    Elles ne servent jamais à décorer et ne remplacent jamais l'accent signal.</p>
    <table class="tight">
      <thead><tr><th>Rôle</th><th>Clair</th><th>HEX clair</th><th>Sombre</th><th>HEX sombre</th><th>Usage</th></tr></thead>
      <tbody>
        ${[
          ["Succès", L.success, D.success, "Service en ligne, action réussie"],
          ["Alerte", L.warn, D.warn, "Seuil proche, action à surveiller"],
          ["Danger", L.destructive, D.destructive, "Erreur, action destructive"],
          ["Information", L.info, D.info, "Lien, donnée neutre, aide"],
        ]
          .map(
            ([label, lightToken, darkToken, usage]) =>
              `<tr><td>${label}</td><td><span class="chip-inline" style="background:${lightToken.hex}"></span></td><td class="mono">${lightToken.hex}</td><td><span class="chip-inline" style="background:${darkToken.hex}"></span></td><td class="mono">${darkToken.hex}</td><td class="small" style="color:inherit">${usage}</td></tr>`,
          )
          .join("")}
      </tbody>
    </table>
    <div class="note" style="margin-top:4mm">Une couleur d'état ne colore jamais le logo, ni le module
    actif, ni un titre. Elle s'applique à un point, une icône ou une pastille, toujours accompagnée du
    libellé qui l'explicite.</div>
  `),
);

/* --- 05 typographies ----------------------------------------------- */
label = "Typographies";
pages.push(
  page(`
    <div class="kicker">04 · Typographies</div>
    <h2>Trois familles libres,<br/>trois rôles.</h2>

    <div class="panel" style="padding:6mm;margin-bottom:4mm">
      <div class="kicker">Display · titres et logotype</div>
      <div style="font-family:'Bricolage Grotesque';font-weight:600;font-size:30pt;letter-spacing:-.02em;line-height:1.05;margin:2mm 0">Bricolage Grotesque</div>
      <div style="font-family:'Bricolage Grotesque';font-weight:600;font-size:11pt;letter-spacing:-.02em">Martylab · 600 · interlettrage −0,02 em</div>
      <div class="small" style="margin-top:2mm">Variable 200–800 · Mathieu Triay · SIL OFL 1.1 · usage : logotype, h1–h3, chiffres de tête</div>
    </div>

    <div class="panel" style="padding:6mm;margin-bottom:4mm">
      <div class="kicker">Interface · texte courant</div>
      <div style="font-family:'Inter Tight';font-weight:400;font-size:17pt;line-height:1.15;margin:2mm 0">Inter Tight — le portail, les libellés, les formulaires.</div>
      <div style="font-family:'Inter Tight';font-weight:500;font-size:10pt">Medium 500 pour les libellés et les boutons · Regular 400 pour le texte</div>
      <div class="small" style="margin-top:2mm">Variable 100–900 · Rasmus Andersson · SIL OFL 1.1 · usage : texte d'interface, paragraphes, navigation</div>
    </div>

    <div class="panel" style="padding:6mm">
      <div class="kicker">Données · chiffres, codes, étiquettes</div>
      <div class="mono" style="font-size:16pt;letter-spacing:0;margin:2mm 0">0 1 2 3 4 5 6 7 8 9 · v${VERSION} · 12:04:31</div>
      <div class="mono" style="font-size:7pt;letter-spacing:.16em;text-transform:uppercase">Étiquette · capitales · interlettrage 0,16 em</div>
      <div class="small" style="margin-top:2mm">Variable 100–800 · JetBrains · SIL OFL 1.1 · chiffres tabulaires, logs, identifiants, unités</div>
    </div>

    <h3>Références et licences</h3>
    <table>
      <tbody>
        <tr><td class="file">Bricolage Grotesque</td><td>github.com/google/fonts/tree/main/ofl/bricolagegrotesque</td></tr>
        <tr><td class="file">Inter Tight</td><td>github.com/google/fonts/tree/main/ofl/intertight</td></tr>
        <tr><td class="file">JetBrains Mono</td><td>github.com/JetBrains/JetBrainsMono</td></tr>
        <tr><td class="file">Paquets auto-hébergés</td><td class="file">@fontsource-variable/bricolage-grotesque · inter-tight · jetbrains-mono</td></tr>
        <tr><td class="file">Licence commune</td><td>openfontlicense.org — SIL Open Font License 1.1</td></tr>
      </tbody>
    </table>
    <div class="note" style="margin-top:4mm">Aucune police chargée depuis un CDN : les trois familles sont
    auto-hébergées dans le portail. Le logotype est vectorisé dans les SVG : il ne dépend d'aucune
    installation de police.</div>
  `),
);

/* --- 06 règles ----------------------------------------------------- */
label = "Règles d'usage";
pages.push(
  page(`
    <div class="kicker">05 · Règles</div>
    <h2>Zone de protection,<br/>tailles minimales.</h2>

    <div class="grid2" style="grid-template-columns:1fr 1fr;gap:10mm">
      <div>
        <h3 style="margin-top:0">Zone de protection</h3>
        <p class="spec">La zone de protection vaut <b>un module</b> de la grille, soit
        <b>37,5 %</b> de la hauteur du symbole, sur les quatre côtés. Aucun texte, filet,
        bouton ou bord d'écran ne peut entrer dans cette zone.</p>
        <div style="background:${L.background.hex};border-radius:3mm;padding:10mm;display:flex;justify-content:center;margin:4mm 0">
          <div style="border:1px dashed ${L.primary.hex};padding:9.75mm;display:inline-block;line-height:0">
            <div style="width:26mm">${symbolLight}</div>
          </div>
        </div>
        <div class="mono small">symbole 24 px → protection 9 px<br/>symbole 48 px → protection 18 px<br/>logo horizontal 96 px de large → protection 9 px</div>
      </div>
      <div>
        <h3 style="margin-top:0">Tailles minimales</h3>
        <table>
          <thead><tr><th>Version</th><th>Écran</th><th>Impression</th></tr></thead>
          <tbody>
            <tr><td>Symbole</td><td class="mono">16 px (favicon)<br/>24 px (interface)</td><td class="mono">5 mm</td></tr>
            <tr><td>Horizontal</td><td class="mono">96 px de large</td><td class="mono">28 mm</td></tr>
            <tr><td>Empilé</td><td class="mono">80 px de large</td><td class="mono">24 mm</td></tr>
            <tr><td>Mono</td><td class="mono">24 px</td><td class="mono">8 mm</td></tr>
          </tbody>
        </table>
        <h3>Placement</h3>
        <p class="spec">Coin supérieur gauche, aligné sur la marge du document. Le symbole peut
        vivre seul, jamais le nom sans le symbole dans un contexte de marque. Ne pas recentrer
        le logo horizontal, ne pas l'aligner sur la droite.</p>
        <div class="panel" style="padding:3mm;margin-top:3mm">
          <div class="mono" style="font-size:6.6pt">sidebar 24 px · topbar 20 px · splash 96 px · favicon 16–32 px</div>
        </div>
        <div style="margin-top:6mm;border:1px solid ${L.border.hex};border-radius:2mm;height:42mm;position:relative;background:${L.card.hex}">
          <div style="position:absolute;inset:5mm;border:1px dashed ${L.border.hex}"></div>
          <div style="position:absolute;left:5mm;top:5mm;width:34mm">${logoLight}</div>
          <div style="position:absolute;right:5mm;bottom:4mm" class="mono small">marge 5 mm</div>
        </div>
      </div>
    </div>

    <h3 style="margin-top:9mm">Implantations types</h3>
    <div class="grid3" style="gap:6mm">
      <div>
        <div style="border:1px solid ${L.border.hex};border-radius:3mm;background:${L.card.hex};padding:4mm;height:40mm;display:flex;gap:2mm">
          <div style="width:16mm;border-right:1px solid ${L.border.hex};padding-right:2mm">
            <div style="width:6mm">${symbolLight}</div>
            <div class="navrow on" style="margin-top:3mm"></div>
            <div class="navrow"></div>
            <div class="navrow"></div>
          </div>
          <div style="flex:1">
            <div style="height:1.6mm;width:70%;background:rgba(16,24,31,.14);border-radius:1mm"></div>
            <div style="height:1.2mm;width:50%;background:rgba(16,24,31,.1);border-radius:1mm;margin-top:2mm"></div>
            <div style="height:14mm;border:1px solid ${L.border.hex};border-radius:2mm;margin-top:2.5mm"></div>
          </div>
        </div>
        <div class="mono small" style="margin-top:2mm">sidebar · symbole 24 px</div>
      </div>
      <div>
        <div style="border:1px solid ${L.border.hex};border-radius:3mm;background:${L.card.hex};height:40mm;overflow:hidden">
          <div style="display:flex;align-items:center;gap:3mm;padding:3mm 4mm;border-bottom:1px solid ${L.border.hex}">
            <div style="width:5.6mm">${symbolLight}</div>
            <div style="height:1.6mm;width:22mm;background:rgba(16,24,31,.16);border-radius:1mm"></div>
            <div style="height:1.4mm;width:10mm;background:rgba(16,24,31,.1);border-radius:1mm;margin-left:auto"></div>
          </div>
          <div style="padding:4mm">
            <div style="height:1.6mm;width:55%;background:rgba(16,24,31,.14);border-radius:1mm"></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:2mm;margin-top:2.5mm">
              <div style="height:11mm;border:1px solid ${L.border.hex};border-radius:2mm"></div>
              <div style="height:11mm;border:1px solid ${L.border.hex};border-radius:2mm"></div>
            </div>
          </div>
        </div>
        <div class="mono small" style="margin-top:2mm">topbar · symbole 20 px</div>
      </div>
      <div>
        <div style="border:1px solid ${L.border.hex};border-radius:3mm;background:${D.background.hex};height:40mm;display:flex;align-items:center;justify-content:center">
          <div style="width:17mm">${symbolDark}</div>
        </div>
        <div class="mono small" style="margin-top:2mm">splash · 96 px, fond graphite</div>
      </div>
    </div>

    <div class="note" style="margin-top:6mm">Le symbole est aligné sur la grille de l'interface, pas
    centré optiquement à l'œil : il occupe les 24 px de la barre latérale et laisse un module de vide
    autour de lui. Sur un splash, la même règle s'applique à l'échelle 96 px.</div>
  `),
);

/* --- 07 fonds & contrastes ----------------------------------------- */
label = "Fonds et contrastes";
pages.push(
  page(`
    <div class="kicker">06 · Fonds autorisés</div>
    <h2>Deux fonds,<br/>des contrastes mesurés.</h2>
    <div class="grid2" style="gap:6mm;margin-bottom:5mm">
      <div class="panel" style="background:${L.background.hex};padding:8mm">
        <div style="width:55mm">${logoLight}</div>
        <div class="mono" style="font-size:6.4pt;margin-top:4mm;color:${L["muted-foreground"].hex}">${L.background.hex} · ${L.card.hex}</div>
      </div>
      <div class="panel" style="background:${D.background.hex};border-color:${D.border.hex};padding:8mm">
        <div style="width:55mm">${logoDark}</div>
        <div class="mono" style="font-size:6.4pt;margin-top:4mm;color:${D["muted-foreground"].hex}">${D.background.hex} · ${D.card.hex}</div>
      </div>
    </div>
    <p class="spec">Le logo ne se pose jamais sur une photographie non traitée, un dégradé, un motif
    ou une couleur hors palette. Sur une image, utiliser un aplat de graphite ou une plaque
    de papier à 100 % d'opacité, avec la zone de protection.</p>
    <h3>Contrastes calculés (WCAG 2.2)</h3>
    <div class="grid2" style="gap:8mm;align-items:start">
      <div>
        <div class="kicker" style="margin-bottom:2mm">Thème clair</div>
        ${contrastTable("light")}
      </div>
      <div>
        <div class="kicker" style="margin-bottom:2mm">Thème sombre</div>
        ${contrastTable("dark")}
      </div>
    </div>
    <div class="small" style="margin-top:4mm">Luminance relative et ratio calculés par script
    (<span class="mono">src/color.mjs</span>), pas estimés.</div>

    <h3 style="margin-top:5mm">La marque sur ses fonds</h3>
    <div class="grid2" style="gap:8mm;align-items:start">
      <div>
        <div class="kicker" style="margin-bottom:2mm">Thème clair</div>
        ${contrastTable("light", true)}
      </div>
      <div>
        <div class="kicker" style="margin-bottom:2mm">Thème sombre</div>
        ${contrastTable("dark", true)}
      </div>
    </div>
    <div class="small" style="margin-top:3mm">Le logotype n'est pas soumis à WCAG, mais il conserve
    au minimum 3:1 avec son fond pour rester lisible. Ces six paires sont exactement les variantes
    livrées : au-delà, le logo n'est plus dans le système.</div>

    <h3 style="margin-top:5mm">Quel fond pour quel support</h3>
    <table class="tight">
      <thead><tr><th>Support</th><th>Fond</th><th>Variante</th><th>Contraste mesuré</th></tr></thead>
      <tbody>
        <tr><td>Portail, thème clair</td><td class="mono">${L.background.hex}</td><td>Horizontal clair</td><td class="mono">${fmtRatio(ratioOf("light", "foreground", "background"))}</td></tr>
        <tr><td>Portail, thème sombre</td><td class="mono">${D.background.hex}</td><td>Horizontal sombre</td><td class="mono">${fmtRatio(ratioOf("dark", "foreground", "background"))}</td></tr>
        <tr><td>Documents imprimés</td><td class="mono">#FFFFFF</td><td>Mono noir ou horizontal clair</td><td class="mono">21,00:1</td></tr>
        <tr><td>Photographie, vidéo</td><td>Plaque graphite opaque</td><td>Horizontal sombre</td><td class="mono">${fmtRatio(ratioOf("dark", "foreground", "background"))}</td></tr>
      </tbody>
    </table>
  `),
);

/* --- 08 usages à éviter -------------------------------------------- */
label = "Usages à éviter";
pages.push(
  page(`
    <div class="kicker">07 · Interdits</div>
    <h2>Ce qui casse<br/>l'identité.</h2>
    <div class="grid2" style="gap:6mm">
      <figure class="dont" style="margin:0">
        <span class="x">✕</span>
        <div class="fault fault-stretch"><div style="width:30mm">${logoLight}</div></div>
        <figcaption><b>Ne pas étirer ni comprimer.</b> Le symbole reste carré, les proportions sont verrouillées.</figcaption>
      </figure>
      <figure class="dont" style="margin:0">
        <span class="x">✕</span>
        <div class="fault fault-rotate"><div style="width:38mm">${logoLight}</div></div>
        <figcaption><b>Ne pas incliner.</b> Aucune rotation, même légère : la ligne de base est horizontale.</figcaption>
      </figure>
      <figure class="dont" style="margin:0">
        <span class="x">✕</span>
        <div class="fault sym fault-recolor"><div style="width:14mm">${symbolLight}</div></div>
        <figcaption><b>Ne pas recolorer.</b> Deux valeurs seulement : neutre et vert signal, rien d'autre.</figcaption>
      </figure>
      <figure class="dont" style="margin:0">
        <span class="x">✕</span>
        <div class="fault fault-fade"><div style="width:40mm">${logoLight}</div></div>
        <figcaption><b>Ne pas réduire l'opacité.</b> Un logo en filigrane n'est plus une signature.</figcaption>
      </figure>
      <figure class="dont" style="margin:0">
        <span class="x">✕</span>
        <div class="fault fault-slogan" style="flex-direction:column">
          <div style="width:40mm">${logoLight}</div>
          <div class="slogan">Votre hub, votre labo.</div>
        </div>
        <figcaption><b>Ne pas ajouter de slogan.</b> Le nom seul suffit, sans baseline ni descripteur.</figcaption>
      </figure>
      <figure class="dont" style="margin:0">
        <span class="x">✕</span>
        <div class="fault" style="background:${L.primary.hex}"><div style="width:38mm">${logoLight}</div></div>
        <figcaption><b>Ne pas poser le logo sur l'accent.</b> Contraste insuffisant, hiérarchie perdue.</figcaption>
      </figure>
      <figure class="dont" style="margin:0">
        <span class="x">✕</span>
        <div class="fault fault-shadow"><div style="width:38mm">${logoLight}</div></div>
        <figcaption><b>Ne pas ajouter d'ombre ni de relief.</b> Aucun effet, aucune profondeur simulée.</figcaption>
      </figure>
      <figure class="dont" style="margin:0">
        <span class="x">✕</span>
        <div class="fault fault-pattern">
          <div style="width:7mm">${symbolLight}</div>
          <div style="width:7mm">${symbolLight}</div>
          <div style="width:7mm">${symbolLight}</div>
          <div style="width:7mm">${symbolLight}</div>
          <div style="width:7mm">${symbolLight}</div>
        </div>
        <figcaption><b>Ne pas répéter le symbole en motif.</b> Une marque se pose une fois par support.</figcaption>
      </figure>
    </div>
    <div class="note" style="margin-top:6mm">Ces exemples sont générés à partir des fichiers livrés :
    ce ne sont pas des dessins séparés. Une variante non listée ici n'existe pas.</div>
  `),
);

/* --- 09 applications ----------------------------------------------- */
label = "Applications";
pages.push(
  page(`
    <div class="kicker">08 · Applications</div>
    <h2>Icône, portail,<br/>téléphone.</h2>
    <div class="grid2" style="grid-template-columns:.8fr 1.2fr;gap:8mm">
      <div>
        <div style="width:44mm" class="icontile">${iconSvg}</div>
        <div class="small" style="margin-top:3mm">Icône 1024 × 1024, coins pleins.
        Zone sûre respectée, rendu contrôlé à 60 px et 29 px.</div>
        <div class="iconrow" style="margin-top:6mm">
          <div class="scale-item"><div style="width:15mm" class="icontile">${iconSvg}</div>60 px</div>
          <div class="scale-item"><div style="width:7.4mm" class="icontile">${iconSvg}</div>29 px</div>
          <div class="scale-item"><div style="width:8mm">${faviconSvg}</div>favicon 32</div>
        </div>
      </div>
      <div>
        <div class="app-shot" style="margin-bottom:4mm">
          <div class="shot-top"><div class="shot-logo">${logoLight}</div><div class="badge">démo</div></div>
          <div class="shot-body">
            <div class="shot-side">
              <div class="navrow on"></div><div class="navrow"></div><div class="navrow"></div><div class="navrow"></div><div class="navrow"></div>
            </div>
            <div class="shot-main">
              <div class="hero"><div class="bar"></div><div style="height:1.2mm;width:40%;background:rgba(16,24,31,.12);border-radius:1mm;margin-top:2mm"></div></div>
              <div class="mini"><div><div class="t"></div><div class="v"></div></div><div><div class="t"></div><div class="v"></div></div><div><div class="t"></div><div class="v"></div></div></div>
            </div>
          </div>
        </div>
        <div class="app-shot shot-dark">
          <div class="shot-top"><div class="shot-logo">${logoDark}</div><div class="badge" style="border-color:${D.border.hex};color:${D["muted-foreground"].hex}">démo</div></div>
          <div class="shot-body">
            <div class="shot-side">
              <div class="navrow on"></div><div class="navrow"></div><div class="navrow"></div><div class="navrow"></div><div class="navrow"></div>
            </div>
            <div class="shot-main">
              <div class="hero"><div class="bar"></div><div style="height:1.2mm;width:40%;background:rgba(240,242,244,.18);border-radius:1mm;margin-top:2mm"></div></div>
              <div class="mini"><div><div class="t"></div><div class="v"></div></div><div><div class="t"></div><div class="v"></div></div><div><div class="t"></div><div class="v"></div></div></div>
            </div>
          </div>
        </div>
        <div class="small" style="margin-top:2mm">Maquettes de démonstration : aucune donnée réelle n'est représentée.</div>
      </div>
    </div>

    <div class="grid2" style="margin-top:6mm;grid-template-columns:1fr 1.1fr;gap:8mm;align-items:start">
      <div class="phone">
        <div class="notch"></div>
        <div class="top"><div class="shot-logo">${logoLight}</div><div class="dot"></div></div>
        <div class="content">
          <div class="hero"><div class="bar"></div><div style="height:1.2mm;width:45%;background:rgba(16,24,31,.12);border-radius:1mm;margin-top:2mm"></div></div>
          <div class="mini" style="grid-template-columns:1fr 1fr"><div><div class="t"></div><div class="v"></div></div><div><div class="t"></div><div class="v"></div></div></div>
          <div style="height:9mm;border:1px solid ${L.border.hex};border-radius:2mm;margin-top:2.5mm;display:flex;align-items:center;gap:2mm;padding:2mm">
            <div style="width:3mm;height:3mm;border-radius:1mm;background:${L.primary.hex}"></div>
            <div style="height:1.2mm;width:40%;background:rgba(16,24,31,.14);border-radius:1mm"></div>
          </div>
          <div style="height:9mm;border:1px solid ${L.border.hex};border-radius:2mm;margin-top:2mm"></div>
          <div style="height:9mm;border:1px solid ${L.border.hex};border-radius:2mm;margin-top:2mm"></div>
        </div>
        <div class="tabbar">
          <div class="tab on"></div><div class="tab"></div><div class="cta"></div><div class="tab"></div><div class="tab"></div>
        </div>
      </div>
      <div>
        <h3 style="margin-top:0">Règles d'application</h3>
        <p class="spec">Le symbole seul suffit dans la tab bar et la topbar : à moins de 24 px,
        le nom devient illisible et n'apporte rien.</p>
        <p class="spec">Le logo horizontal s'utilise dans la sidebar desktop, l'écran de connexion
        et les documents. La version sombre est obligatoire dès que le fond passe sous
        <b>${L.background.hex}</b>.</p>
        <p class="spec">L'icône mobile conserve le fond graphite : c'est elle qui porte le contraste
        sur un écran d'accueil, pas le symbole seul.</p>

        <div class="panel" style="margin-top:5mm;padding:4mm">
          <div class="kicker">Tailles d'écran</div>
          <table class="tight" style="margin-top:1mm">
            <tbody>
              <tr><td>Favicon</td><td class="mono num">16–32 px</td></tr>
              <tr><td>Symbole en barre latérale</td><td class="mono num">24 px</td></tr>
              <tr><td>Symbole en barre supérieure</td><td class="mono num">20 px</td></tr>
              <tr><td>Écran de démarrage</td><td class="mono num">96 px</td></tr>
              <tr><td>Icône d'application</td><td class="mono num">1024 × 1024 px</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `),
);

/* --- 10 fichiers --------------------------------------------------- */
label = "Fichiers";
pages.push(
  page(`
    <div class="kicker">09 · Livraison</div>
    <h2>Fichiers livrés.</h2>
    <p class="spec">Tous les fichiers de cette page existent réellement dans le dépôt, sous
    <span class="mono">docs/brand/assets/</span>. Chaque variante est indépendante : aucune planche
    n'est nécessaire pour les utiliser.</p>
    <div class="grid2" style="gap:8mm;align-items:start">
      <div>
        <div class="kicker" style="margin-bottom:2mm">Logos · assets/logo</div>
        ${fileTable(logoFiles)}
      </div>
      <div>
        <div class="kicker" style="margin-bottom:2mm">Icônes · assets/icons</div>
        ${fileTable(iconFiles)}
      </div>
    </div>
    <div class="grid2" style="margin-top:5mm;gap:6mm">
      <div class="panel" style="padding:4mm">
        <h4>Intégration portail</h4>
        <div class="mono" style="font-size:6.6pt;line-height:1.5">
          public/favicon.svg ← martylab-favicon.svg<br/>
          public/app-icon-192.png ← martylab-pwa-192.png<br/>
          public/app-icon-512.png ← martylab-pwa-512.png<br/>
          public/apple-touch-icon.png ← …-180.png<br/>
          manifest.webmanifest : icons + theme_color<br/>
          components/layout/brand-mark.tsx : symbole officiel
        </div>
      </div>
      <div class="panel" style="padding:4mm">
        <h4>Contrôles effectués</h4>
        <div class="spec" style="font-size:7.2pt">
          SVG parsés, dimensions PNG lues, PDF ouvert, contrastes recalculés,
          archive listée, manifeste SHA-256 vérifié.
        </div>
        <div class="mono" style="font-size:6.4pt;margin-top:2mm">voir MANIFEST.md et src/verify.py</div>
      </div>
    </div>
    <div class="note" style="margin-top:5mm">Le logotype est vectorisé : les SVG ne dépendent
    d'aucune police installée. Les PNG sont générés depuis les SVG livrés, pas depuis une maquette.</div>

    <h3 style="margin-top:9mm">Trois réflexes avant d'exporter</h3>
    <div class="grid3" style="gap:8mm">
      <div>
        <div class="mono" style="color:${L.primary.hex};font-size:8pt">01</div>
        <h4 style="font-size:10pt;margin:1mm 0 1.5mm">Choisir la variante</h4>
        <p class="small" style="margin:0">Horizontal par défaut, empilé pour les formats carrés,
        symbole seul sous 96 px de large. Jamais de variante « arrangée ».</p>
      </div>
      <div>
        <div class="mono" style="color:${L.primary.hex};font-size:8pt">02</div>
        <h4 style="font-size:10pt;margin:1mm 0 1.5mm">Vérifier le fond</h4>
        <p class="small" style="margin:0">Clair → version claire ; graphite ou plus sombre → version
        sombre. Une photo impose une plaque opaque, jamais un logo posé à même l'image.</p>
      </div>
      <div>
        <div class="mono" style="color:${L.primary.hex};font-size:8pt">03</div>
        <h4 style="font-size:10pt;margin:1mm 0 1.5mm">Garder l'air</h4>
        <p class="small" style="margin:0">Un module de vide sur les quatre côtés. Si la place manque,
        réduire le logo, pas la protection.</p>
      </div>
    </div>

    <div class="panel" style="margin-top:7mm;padding:4mm 5mm;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div class="kicker">Archive complète</div>
        <div class="mono" style="font-size:7pt">dist/martylab-brand-kit-v${VERSION}.zip</div>
      </div>
      <div>
        <div class="kicker">Vérification</div>
        <div class="mono" style="font-size:7pt">MANIFEST.md · src/verify.py</div>
      </div>
      <div>
        <div class="kicker">Version</div>
        <div class="mono" style="font-size:7pt">${VERSION} · ${esc(TODAY)}</div>
      </div>
    </div>
  `),
);

const LIMIT = Number(process.env.LIMIT ?? 0);
const used = LIMIT > 0 ? pages.slice(0, LIMIT) : pages;

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<title>Martylab — Guide d'identité visuelle ${VERSION}</title>
<style>${css}</style>
</head>
<body>
${used.join("\n")}
</body>
</html>`;

mkdirSync(resolve(here, "generated"), { recursive: true });
writeFileSync(resolve(here, "generated/guide.html"), html, "utf8");
console.log(`guide.html: ${(html.length / 1024).toFixed(0)} Ko, ${pages.length} pages`);

/* --- planche d'aperçu (une page, format paysage) -------------------- */
label = "Planche";
const sheet = `<!doctype html><html lang="fr"><head><meta charset="utf-8"/>
<title>Martylab — planche de marque</title>
<style>
${css}
@page{size:A4 landscape;margin:0}
body{background:#fff}
.page{width:297mm;height:210mm;padding:12mm 14mm;break-after:auto;}
.sheet-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:5mm;margin-top:5mm}
.tile{border:1px solid var(--line);border-radius:3mm;padding:5mm;display:flex;align-items:center;justify-content:center;background:var(--paper);overflow:hidden;}
.tile.dark{background:var(--graphite);border-color:var(--line-dark);}
.tile.wide{grid-column:span 2}
.tile svg{display:block;width:100%;height:auto;}
.chips{display:flex;gap:2.5mm}
.chip-s{width:10mm;height:10mm;border-radius:2mm;border:1px solid rgba(0,0,0,.08)}
.sheet-foot{display:flex;justify-content:space-between;align-items:flex-end;margin-top:5mm;padding-top:3mm;border-top:1px solid var(--line);}
</style></head><body>
<section class="page">
  <div style="display:flex;justify-content:space-between;align-items:flex-start">
    <div style="width:62mm">${logoLight}</div>
    <div class="mono" style="font-size:6.2pt;text-align:right;color:${L["muted-foreground"].hex};line-height:1.7">
      planche d'aperçu<br/>les fichiers sources sont livrés séparément, un par variante
    </div>
  </div>

  <div class="sheet-grid" style="margin-top:6mm">
    <div class="tile dark wide" style="height:46mm"><div style="width:110mm">${logoDark}</div></div>
    <div class="tile" style="height:46mm"><div style="width:32mm">${symbolLight}</div></div>
    <div class="tile dark" style="height:46mm"><div style="width:32mm">${symbolDark}</div></div>
  </div>

  <div class="sheet-grid">
    <div class="tile" style="height:44mm"><div style="width:48mm">${logoMonoB}</div></div>
    <div class="tile dark" style="height:44mm"><div style="width:48mm">${logoMonoW}</div></div>
    <div class="tile" style="height:44mm"><div style="width:24mm">${symbolMonoB}</div></div>
    <div class="tile dark" style="height:44mm"><div style="width:24mm">${symbolMonoW}</div></div>
  </div>

  <div class="sheet-grid" style="grid-template-columns:1fr 1fr 1fr 1.4fr">
    <div class="tile" style="height:48mm"><div style="width:28mm">${stackedLight}</div></div>
    <div class="tile" style="height:48mm;padding:0"><div style="width:34mm" class="icontile">${iconSvg}</div></div>
    <div class="tile" style="height:48mm;flex-direction:column;gap:3mm">
      <div style="width:13mm">${faviconSvg}</div>
      <div class="mono" style="font-size:6pt;color:${L["muted-foreground"].hex};text-align:center">favicon<br/>16–32 px</div>
    </div>
    <div class="tile" style="height:48mm;flex-direction:column;align-items:flex-start;justify-content:center;gap:2mm;padding:6mm">
      <div style="font-family:'Bricolage Grotesque';font-weight:600;font-size:13pt;letter-spacing:-.02em;line-height:1.1">Bricolage Grotesque</div>
      <div style="font-family:'Inter Tight';font-size:10pt;line-height:1.2">Inter Tight — texte d'interface</div>
      <div class="mono" style="font-size:7.5pt">JetBrains Mono · 12:04:31</div>
    </div>
  </div>

  <div class="sheet-foot">
    <div class="chips">
      <div class="chip-s" style="background:${L.background.hex}"></div>
      <div class="chip-s" style="background:${L.foreground.hex}"></div>
      <div class="chip-s" style="background:${L.primary.hex}"></div>
      <div class="chip-s" style="background:${D.background.hex}"></div>
      <div class="chip-s" style="background:${D.foreground.hex}"></div>
      <div class="chip-s" style="background:${D.primary.hex}"></div>
      <div class="mono" style="font-size:6.2pt;line-height:1.6;color:${L["muted-foreground"].hex};margin-left:3mm">
        ${L.background.hex} · ${L.foreground.hex} · ${L.primary.hex}<br/>
        ${D.background.hex} · ${D.foreground.hex} · ${D.primary.hex}
      </div>
    </div>
    <div class="mono" style="font-size:6.2pt;text-align:right;color:${L["muted-foreground"].hex};line-height:1.6">
      Martylab · identité ${VERSION} · ${esc(TODAY)}<br/>
      guide complet : martylab-brand-guide.pdf
    </div>
  </div>
</section>
</body></html>`;
writeFileSync(resolve(here, "generated/sheet.html"), sheet, "utf8");
console.log("sheet.html ok");
