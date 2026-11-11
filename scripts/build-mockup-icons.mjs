/**
 * Génère un sprite SVG autonome pour le prototype de refonte.
 * Source : lucide-react (déjà installé). Sortie : docs/redesign/icons.js
 *
 * Usage : node scripts/build-mockup-icons.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const iconsDir = resolve(root, "node_modules/lucide-react/dist/esm/icons");
const outDir = resolve(root, "docs/redesign");

/** Icônes utilisées par le prototype (nom lucide → id de symbole). */
const ICONS = [
  "layout-dashboard",
  "bot",
  "blocks",
  "server",
  "trophy",
  "images",
  "tv",
  "workflow",
  "puzzle",
  "history",
  "settings",
  "users",
  "log-out",
  "search",
  "bell",
  "sun",
  "moon",
  "chevron-down",
  "chevron-right",
  "arrow-right",
  "arrow-up-right",
  "plus",
  "send",
  "menu",
  "x",
  "check",
  "triangle-alert",
  "circle-check",
  "activity",
  "cpu",
  "memory-stick",
  "hard-drive",
  "thermometer",
  "clock",
  "network",
  "database",
  "cloud",
  "container",
  "terminal",
  "play",
  "square",
  "rotate-ccw",
  "file-text",
  "external-link",
  "trash-2",
  "pencil",
  "user-plus",
  "sparkles",
  "more-horizontal",
  "refresh-cw",
  "power",
  "wifi",
  "calendar",
  "message-square",
  "film",
  "library",
  "play-circle",
  "monitor-play",
  "download",
  "smartphone",
  "zap",
  "command",
  "filter",
  "list",
  "sliders-horizontal",
  "eye",
  "shield",
  "key",
  "globe",
  "pin",
  "volume-x",
  "monitor",
  "radio",
  "hard-drive-download",
  "scan-line",
  "panel-left",
  "layers",
  "git-branch",
];

const ATTR_MAP = {
  strokeWidth: "stroke-width",
  strokeLinecap: "stroke-linecap",
  strokeLinejoin: "stroke-linejoin",
  fillRule: "fill-rule",
  clipRule: "clip-rule",
};

function pascal(name) {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function attrsToString(attrs, key) {
  const pairs = Object.entries(attrs)
    .filter(([name]) => name !== "key")
    .map(([name, value]) => {
      const attr = ATTR_MAP[name] ?? name;
      return `${attr}="${String(value).replaceAll('"', "&quot;")}"`;
    });
  return pairs.length > 0 ? ` ${pairs.join(" ")}` : "";
}

function toSymbol(name) {
  const file = resolve(iconsDir, `${name}.mjs`);
  const source = readFileSync(file, "utf8");
  const start = source.indexOf("const __iconNode = [");
  const end = source.indexOf("];", start);
  if (start === -1 || end === -1) {
    // Certains fichiers sont des alias : export { default } from './autre.mjs';
    const alias = source.match(/export \{ default \} from '\.\/(.+)\.mjs'/);
    if (alias) {
      return toSymbol(alias[1]);
    }
    throw new Error(`__iconNode introuvable pour ${name}`);
  }
  const arraySource = source.slice(start + "const __iconNode = ".length, end + 1);
  const node = Function(`"use strict"; return ${arraySource};`)();
  const body = node
    .map(([tag, attrs]) => `<${tag}${attrsToString(attrs)} />`)
    .join("");
  return `<symbol id="i-${name}" viewBox="0 0 24 24">${body}</symbol>`;
}

const symbols = ICONS.map(toSymbol).join("");
const output = `/* Généré par scripts/build-mockup-icons.mjs — ne pas éditer à la main. */
(function () {
  var sprite = '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false">${symbols.replaceAll("'", "\\'")}</svg>';
  document.addEventListener("DOMContentLoaded", function () {
    document.body.insertAdjacentHTML("afterbegin", sprite);
  });
})();
`;

mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "icons.js"), output, "utf8");
console.log(`icons.js généré (${ICONS.length} icônes, ${output.length} octets)`);
