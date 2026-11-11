/**
 * Martylab — génération des SVG de marque et des PNG d'icônes.
 *
 * Entrées : generated/palette.json (couleurs calculées), generated/wordmark.json
 *           (tracés du logotype, Bricolage Grotesque 600, -0.02em).
 * Sorties : assets/logo/*.svg, assets/icons/*.svg|png
 *
 * Aucune police n'est référencée dans les SVG : le logotype est vectorisé.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const brand = resolve(here, "..");
const palette = JSON.parse(readFileSync(resolve(here, "generated/palette.json"), "utf8"));
const wordmark = JSON.parse(readFileSync(resolve(here, "generated/wordmark.json"), "utf8"));

const light = palette.tokens.light;
const dark = palette.tokens.dark;

mkdirSync(resolve(brand, "assets/logo"), { recursive: true });
mkdirSync(resolve(brand, "assets/icons"), { recursive: true });

/* ------------------------------------------------------------------ */
/* Géométrie du symbole                                                */
/* ------------------------------------------------------------------ */

/** Grille 32 : module 12, gouttière 4, rayon 3,5, origine 2 (marges optiques). */
export const GRID = 32;
export const MODULE = 12;
export const GAP = 4;
export const RADIUS = 3.5;
export const ORIGIN = 2;

/** Positions des quatre modules, le quatrième (bas droite) est l'actif. */
function modules() {
  const step = MODULE + GAP;
  const out = [];
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 2; col += 1) {
      out.push({ x: ORIGIN + col * step, y: ORIGIN + row * step, active: row === 1 && col === 1 });
    }
  }
  return out;
}

/**
 * Symbol groupé dans un carré `size`, à la position (x, y).
 * Les coordonnées sont cuites dans les rectangles : aucun transform résiduel.
 */
export function symbolGroup(size, { x = 0, y = 0, neutral, accent }, extra = "") {
  const k = size / GRID;
  const rects = modules()
    .map((m) => {
      const rx = Number((m.x * k + x).toFixed(2));
      const ry = Number((m.y * k + y).toFixed(2));
      const w = Number((MODULE * k).toFixed(2));
      const r = Number((RADIUS * k).toFixed(2));
      const fill = m.active ? accent : neutral;
      return `  <rect x="${rx}" y="${ry}" width="${w}" height="${w}" rx="${r}" fill="${fill}"${m.active ? ' data-module="active"' : ""}/>`;
    })
    .join("\n");
  return `${extra}${rects}`;
}

function svg({ width, height, body, title, extra = "" }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}">
  <title>${title}</title>
${extra}${body}
</svg>
`;
}

/* ------------------------------------------------------------------ */
/* Logos                                                               */
/* ------------------------------------------------------------------ */

const W = wordmark; // size 100, bbox [7.733, -71.033, 419.567, 17.867]

/**
 * Traduit un chemin SVG absolu (M, L, Q, H, V, Z) : aucun transform résiduel
 * n'est laissé dans les fichiers livrés.
 */
function translatePath(d, dx, dy) {
  const fmt = (v) => Number(v.toFixed(2));
  return d.replace(/([MLQVHZ])([^MLQVHZ]*)/g, (_, cmd, args) => {
    if (cmd === "Z") return "Z";
    const n = (args.match(/-?\d*\.?\d+/g) ?? []).map(Number);
    if (cmd === "H") return `H${fmt(n[0] + dx)}`;
    if (cmd === "V") return `V${fmt(n[0] + dy)}`;
    const out = [];
    for (let i = 0; i < n.length; i += 2) {
      out.push(fmt(n[i] + dx), fmt(n[i + 1] + dy));
    }
    return cmd + out.join(" ");
  });
}

function wordmarkPath(fill, tx, baseline) {
  return `  <path d="${translatePath(W.path, tx, baseline)}" fill="${fill}"/>`;
}

function horizontal({ ink, neutral, accent, name }) {
  const symbolSize = W.ascender; // 71.033 : le symbole prend la hauteur d'ascendante
  const gap = 24;
  const textLeft = symbolSize + gap; // bord gauche optique du M
  const tx = textLeft - W.bbox[0];
  const symbolTop = -(W.capHeight / 2 + symbolSize / 2); // centré sur la hauteur de capitale
  const top = Math.min(W.bbox[1], symbolTop);
  const bottom = Math.max(W.bbox[3], symbolTop + symbolSize);
  const width = Number((textLeft + (W.bbox[2] - W.bbox[0])).toFixed(2));
  const height = Number((bottom - top).toFixed(2));
  const shift = -top;

  const body = [
    symbolGroup(symbolSize, { x: 0, y: symbolTop + shift, neutral, accent }),
    wordmarkPath(ink, tx, shift),
  ].join("\n");

  return {
    width,
    height,
    svg: svg({ width, height, title: `Martylab — logo horizontal (${name})`, body }),
    metrics: { symbolSize, gap, width, height },
  };
}

function stacked({ ink, neutral, accent, name }) {
  const symbolSize = 104;
  const gap = 22;
  const textHeight = W.bbox[3] - W.bbox[1]; // 88.9
  const width = Number(Math.max(symbolSize, W.bbox[2] - W.bbox[0]).toFixed(2));
  const height = Number((symbolSize + gap + textHeight).toFixed(2));
  const symbolX = (width - symbolSize) / 2;
  const tx = (width - (W.bbox[2] - W.bbox[0])) / 2 - W.bbox[0];
  const baseline = symbolSize + gap + W.ascender;

  const body = [
    symbolGroup(symbolSize, { x: symbolX, y: 0, neutral, accent }),
    wordmarkPath(ink, tx, baseline),
  ].join("\n");

  return {
    width,
    height,
    svg: svg({ width, height, title: `Martylab — logo empilé (${name})`, body }),
    metrics: { symbolSize, gap, width, height },
  };
}

export function symbol({ neutral, accent, name, size = 32 }) {
  const body = symbolGroup(size, { x: 0, y: 0, neutral, accent });
  return {
    width: size,
    height: size,
    svg: svg({ width: size, height: size, title: `Martylab — symbole (${name})`, body }),
  };
}

const variants = {
  "martylab-logo-horizontal.svg": horizontal({ ink: light.foreground.hex, neutral: light.foreground.hex, accent: light.primary.hex, name: "fond clair" }),
  "martylab-logo-horizontal-dark.svg": horizontal({ ink: dark.foreground.hex, neutral: dark.foreground.hex, accent: dark.primary.hex, name: "fond sombre" }),
  "martylab-logo-stacked.svg": stacked({ ink: light.foreground.hex, neutral: light.foreground.hex, accent: light.primary.hex, name: "fond clair" }),
  "martylab-logo-stacked-dark.svg": stacked({ ink: dark.foreground.hex, neutral: dark.foreground.hex, accent: dark.primary.hex, name: "fond sombre" }),
  "martylab-symbol.svg": symbol({ neutral: light.foreground.hex, accent: light.primary.hex, name: "couleur, fond clair" }),
  "martylab-symbol-dark.svg": symbol({ neutral: dark.foreground.hex, accent: dark.primary.hex, name: "couleur, fond sombre" }),
  "martylab-symbol-mono-black.svg": symbol({ neutral: "#8C8C8C", accent: "#000000", name: "monochrome noir" }),
  "martylab-symbol-mono-white.svg": symbol({ neutral: "#A6A6A6", accent: "#FFFFFF", name: "monochrome blanc" }),
  "martylab-logo-horizontal-mono-black.svg": horizontal({ ink: "#000000", neutral: "#8C8C8C", accent: "#000000", name: "monochrome noir" }),
  "martylab-logo-horizontal-mono-white.svg": horizontal({ ink: "#FFFFFF", neutral: "#A6A6A6", accent: "#FFFFFF", name: "monochrome blanc" }),
};

for (const [file, data] of Object.entries(variants)) {
  writeFileSync(resolve(brand, "assets/logo", file), data.svg, "utf8");
}

/* ------------------------------------------------------------------ */
/* Icônes                                                              */
/* ------------------------------------------------------------------ */

/** Icône d'application : fond plein, symbole dans la zone sûre. */
function appIcon({ size = 1024, box = 560, background = dark.background.hex, neutral = dark.foreground.hex, accent = dark.primary.hex, name }) {
  const r = 0;
  const offset = (size - box) / 2;
  const body = [
    `  <rect x="0" y="0" width="${size}" height="${size}" rx="${r}" fill="${background}"/>`,
    symbolGroup(box, { x: offset, y: offset, neutral, accent }),
  ].join("\n");
  return {
    size,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Martylab — icône d'application">
  <title>Martylab — icône d'application</title>
${body}
</svg>
`,
  };
}

/** Calque avant Android (transparent) : le fond est fourni par la plateforme. */
function adaptiveForeground(size, box) {
  const offset = (size - box) / 2;
  const body = symbolGroup(box, { x: offset, y: offset, neutral: dark.foreground.hex, accent: dark.primary.hex });
  return {
    size,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Martylab — calque avant icône adaptative">
  <title>Martylab — calque avant icône adaptative</title>
${body}
</svg>
`,
  };
}

/** Favicon : plaque graphite + modules simplifiés, lisible à 16 px. */
function favicon() {
  const modules = [
    { x: 3, y: 3, active: false },
    { x: 18, y: 3, active: false },
    { x: 3, y: 18, active: false },
    { x: 18, y: 18, active: true },
  ]
    .map(
      (m) =>
        `<rect x="${m.x}" y="${m.y}" width="11" height="11" rx="2.5" fill="${m.active ? dark.primary.hex : dark.foreground.hex}"/>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" role="img" aria-label="Martylab">
  <title>Martylab</title>
  <rect x="0" y="0" width="32" height="32" rx="7" fill="${dark.background.hex}"/>
  ${modules}
</svg>
`;
}

/** Badge de notification : silhouette blanche sur fond transparent (Android la teinte). */
function notificationBadge(size = 96) {
  const box = size * 0.8;
  const offset = (size - box) / 2;
  const body = symbolGroup(box, { x: offset, y: offset, neutral: "#FFFFFF", accent: "#FFFFFF" });
  return {
    size,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Martylab — badge de notification">
  <title>Martylab — badge de notification</title>
${body}
</svg>
`,
  };
}

const icons = {
  "martylab-app-icon.svg": appIcon({ box: 620, name: "app icon" }).svg,
  "martylab-app-icon-maskable.svg": appIcon({ box: 460, name: "maskable" }).svg,
  "martylab-app-icon-foreground.svg": adaptiveForeground(1024, 440).svg,
  "martylab-favicon.svg": favicon(),
  "martylab-notification-badge.svg": notificationBadge(96).svg,
};

for (const [file, content] of Object.entries(icons)) {
  writeFileSync(resolve(brand, "assets/icons", file), content, "utf8");
}

/* ------------------------------------------------------------------ */
/* PNG                                                                 */
/* ------------------------------------------------------------------ */

const resvgPath = process.env.RESVG_MODULE ??
  `${process.env.TEMP}\\brandtools\\node_modules\\@resvg\\resvg-js\\index.js`;
const { Resvg } = await import(new URL(`file:///${resvgPath.replace(/\\/g, "/")}`).href);

function render(svgString, width, height, file) {
  const resvg = new Resvg(svgString, {
    fitTo: { mode: "width", value: width },
    background: "rgba(0,0,0,0)",
  });
  const png = resvg.render().asPng();
  const target = resolve(brand, "assets/icons", file);
  writeFileSync(target, png);
  const meta = resvg.render();
  console.log(`${file}: ${width}×${height} (${png.length} o)`);
  return { file, width, height, bytes: png.length };
}

const appSvg = icons["martylab-app-icon.svg"];
const maskableSvg = icons["martylab-app-icon-maskable.svg"];
const fgSvg = icons["martylab-app-icon-foreground.svg"];

const rendered = [
  render(appSvg, 1024, 1024, "martylab-app-icon-1024.png"),
  render(maskableSvg, 1024, 1024, "martylab-app-icon-maskable-1024.png"),
  render(fgSvg, 1024, 1024, "martylab-app-icon-foreground-1024.png"),
  render(appSvg, 512, 512, "martylab-pwa-512.png"),
  render(appSvg, 192, 192, "martylab-pwa-192.png"),
  render(appSvg, 180, 180, "martylab-apple-touch-icon-180.png"),
  render(icons["martylab-favicon.svg"], 32, 32, "martylab-favicon-32.png"),
  render(icons["martylab-notification-badge.svg"], 96, 96, "martylab-notification-badge-96.png"),
];

/* ------------------------------------------------------------------ */
/* Métriques publiées (consommées par le guide)                        */
/* ------------------------------------------------------------------ */

const manifest = {
  generatedAt: new Date().toISOString(),
  wordmark: { font: W.font, weight: W.weight, trackingEm: W.trackingEm, capHeight: W.capHeight },
  grid: { GRID, MODULE, GAP, RADIUS, ORIGIN },
  horizontal: variants["martylab-logo-horizontal.svg"].metrics,
  stacked: variants["martylab-logo-stacked.svg"].metrics,
  png: rendered,
};
writeFileSync(resolve(here, "generated/assets.json"), JSON.stringify(manifest, null, 2));

console.log("logos:", Object.keys(variants).length, "icônes SVG:", Object.keys(icons).length);
console.log("horizontal:", variants["martylab-logo-horizontal.svg"].metrics);
console.log("stacked:", variants["martylab-logo-stacked.svg"].metrics);
