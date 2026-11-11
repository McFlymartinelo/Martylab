/**
 * Martylab — conversion OKLCH → sRGB et calcul des contrastes WCAG 2.2.
 *
 * Source de vérité des couleurs : apps/portal/src/index.css (jetons OKLCH).
 * Aucune valeur n'est estimée : tout est calculé ici, puis écrit dans
 * generated/palette.json (consommé par les scripts de build et le guide).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/** OKLab (L, a, b) → sRGB linéaire (0..1), puis gamma. */
function oklabToSrgb(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const gamma = (c) => {
    const v = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
    return v;
  };
  return [gamma(r), gamma(g), gamma(bl)];
}

export function oklchToRgb(oklch) {
  const L = oklch.l;
  const C = oklch.c;
  const H = (oklch.h * Math.PI) / 180;
  const a = C * Math.cos(H);
  const b = C * Math.sin(H);
  const [r, g, bl] = oklabToSrgb(L, a, b);
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const to255 = (v) => Math.round(clamp(v) * 255);
  return { r: to255(r), g: to255(g), b: to255(bl), inGamut: [r, g, bl].every((v) => v >= -0.0005 && v <= 1.0005) };
}

export function hex(rgb) {
  return "#" + [rgb.r, rgb.g, rgb.b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
}

/** Luminance relative WCAG. */
export function luminance({ r, g, b }) {
  const lin = (v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const tokens = {
  light: {
    background: { l: 0.973, c: 0.006, h: 235 },
    foreground: { l: 0.205, c: 0.018, h: 245 },
    card: { l: 0.995, c: 0.002, h: 235 },
    primary: { l: 0.52, c: 0.135, h: 138 },
    "primary-foreground": { l: 0.99, c: 0.005, h: 138 },
    "muted-foreground": { l: 0.42, c: 0.016, h: 245 },
    border: { l: 0.896, c: 0.008, h: 240 },
    sidebar: { l: 0.915, c: 0.012, h: 235 },
    destructive: { l: 0.52, c: 0.19, h: 25 },
    success: { l: 0.5, c: 0.14, h: 155 },
    warn: { l: 0.7, c: 0.16, h: 72 },
    info: { l: 0.52, c: 0.14, h: 245 },
  },
  dark: {
    background: { l: 0.175, c: 0.014, h: 250 },
    foreground: { l: 0.96, c: 0.004, h: 250 },
    card: { l: 0.215, c: 0.016, h: 250 },
    primary: { l: 0.72, c: 0.12, h: 138 },
    "primary-foreground": { l: 0.16, c: 0.02, h: 138 },
    "muted-foreground": { l: 0.64, c: 0.012, h: 250 },
    border: { l: 0.305, c: 0.016, h: 250 },
    sidebar: { l: 0.12, c: 0.012, h: 250 },
    destructive: { l: 0.65, c: 0.19, h: 25 },
    success: { l: 0.72, c: 0.14, h: 155 },
    warn: { l: 0.78, c: 0.15, h: 72 },
    info: { l: 0.72, c: 0.12, h: 245 },
  },
};

const out = { tokens: {}, checks: [] };
for (const [mode, set] of Object.entries(tokens)) {
  out.tokens[mode] = {};
  for (const [name, value] of Object.entries(set)) {
    const rgb = oklchToRgb(value);
    out.tokens[mode][name] = {
      oklch: value,
      hex: hex(rgb),
      rgb,
      css: `oklch(${(value.l * 100).toFixed(1)}% ${value.c} ${value.h})`,
    };
  }
}

const checks = [
  ["light", "foreground", "background", 4.5, "Texte principal / fond"],
  ["light", "muted-foreground", "background", 4.5, "Texte secondaire / fond"],
  ["light", "muted-foreground", "card", 4.5, "Texte secondaire / carte"],
  ["light", "primary", "background", 3, "Accent (élément non textuel) / fond"],
  ["light", "primary", "card", 3, "Accent / carte"],
  ["light", "primary-foreground", "primary", 4.5, "Texte sur accent"],
  ["light", "destructive", "background", 4.5, "Danger / fond"],
  ["light", "success", "background", 4.5, "Succès / fond"],
  ["dark", "foreground", "background", 4.5, "Texte principal / fond"],
  ["dark", "muted-foreground", "background", 4.5, "Texte secondaire / fond"],
  ["dark", "muted-foreground", "card", 4.5, "Texte secondaire / carte"],
  ["dark", "primary", "background", 3, "Accent (élément non textuel) / fond"],
  ["dark", "primary", "card", 3, "Accent / carte"],
  ["dark", "primary-foreground", "primary", 4.5, "Texte sur accent"],
  ["dark", "destructive", "background", 4.5, "Danger / fond"],
  ["dark", "success", "background", 4.5, "Succès / fond"],
];

for (const [mode, fgToken, bgToken, target, label] of checks) {
  const fg = out.tokens[mode][fgToken];
  const bg = out.tokens[mode][bgToken];
  const ratio = contrast(fg.rgb, bg.rgb);
  out.checks.push({
    mode,
    fg: fgToken,
    bg: bgToken,
    fgHex: fg.hex,
    bgHex: bg.hex,
    ratio: Math.round(ratio * 100) / 100,
    target,
    pass: ratio >= target,
    label,
  });
}

// Contrastes du logotype sur ses fonds de référence.
const brandPairs = [
  ["light", "foreground", "background"],
  ["light", "primary", "background"],
  ["dark", "foreground", "background"],
  ["dark", "primary", "background"],
  ["dark", "foreground", "sidebar"],
  ["light", "foreground", "card"],
];

for (const [mode, fgToken, bgToken] of brandPairs) {
  const fg = out.tokens[mode][fgToken];
  const bg = out.tokens[mode][bgToken];
  out.checks.push({
    mode,
    fg: fgToken,
    bg: bgToken,
    fgHex: fg.hex,
    bgHex: bg.hex,
    ratio: Math.round(contrast(fg.rgb, bg.rgb) * 100) / 100,
    target: 3,
    pass: contrast(fg.rgb, bg.rgb) >= 3,
    label: `Marque ${fgToken} sur ${bgToken}`,
  });
}

out.generatedAt = new Date().toISOString();
out.method = "OKLCH → OKLab → sRGB linéaire → gamma 2.4 ; contraste WCAG 2.2 (luminance relative).";

mkdirSync(resolve(here, "generated"), { recursive: true });
writeFileSync(resolve(here, "generated/palette.json"), JSON.stringify(out, null, 2));

const fails = out.checks.filter((c) => !c.pass);
console.log(JSON.stringify(out.tokens.light.primary, null, 2));
console.log(JSON.stringify(out.tokens.dark.primary, null, 2));
console.log(`checks: ${out.checks.length}, échecs: ${fails.length}`);
if (fails.length) console.table(fails);
