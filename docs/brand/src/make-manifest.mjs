/**
 * Martylab — manifeste SHA-256 du kit de marque.
 *
 * Écrit docs/brand/MANIFEST.md à partir des fichiers réellement présents.
 * À exécuter après build-assets / build-guide, avant l'archive.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const brand = resolve(here, "..");
const root = resolve(brand, "..", "..");
const assets = JSON.parse(readFileSync(resolve(here, "generated/assets.json"), "utf8"));
const palette = JSON.parse(readFileSync(resolve(here, "generated/palette.json"), "utf8"));
const VERSION = "1.0.0";

const groups = [
  ["Logos vectoriels", "assets/logo"],
  ["Icônes", "assets/icons"],
  ["Documents", "."],
];

const dims = new Map(assets.png.map((p) => [p.file, `${p.width} × ${p.height}`]));
dims.set("martylab-favicon.svg", "32 × 32");

const entries = [];
for (const [label, dir] of groups) {
  const abs = resolve(brand, dir);
  const files = readdirSync(abs)
    .filter((f) => /\.(svg|png|pdf)$/.test(f))
    .sort();
  entries.push(`\n### ${label}\n`);
  entries.push("| Fichier | Dimensions | Octets | SHA-256 |");
  entries.push("| --- | --- | --- | --- |");
  for (const f of files) {
    const p = resolve(abs, f);
    const buf = readFileSync(p);
    const hash = createHash("sha256").update(buf).digest("hex");
    const dim = dims.get(f) ?? (f.endsWith(".svg") ? "vectoriel" : f.endsWith(".pdf") ? "A4 · 10 pages" : "—");
    entries.push(`| \`${f}\` | ${dim} | ${statSync(p).size} | \`${hash}\` |`);
  }
}

const md = `# Manifeste — kit de marque Martylab v${VERSION}

Généré le ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(new Date())}
par \`src/make-manifest.mjs\`, à partir des fichiers présents sur disque.

- Version : ${VERSION}
- Accent clair : ${palette.tokens.light.primary.hex} (\`${palette.tokens.light.primary.css}\`)
- Accent sombre : ${palette.tokens.dark.primary.hex} (\`${palette.tokens.dark.primary.css}\`)
- Logotype : Bricolage Grotesque 600, interlettrage −0,02 em, vectorisé
${entries.join("\n")}

## Vérification

\`\`\`bash
python docs/brand/src/verify.py
\`\`\`

Le script recalcule les hachages, lit les dimensions réelles des PNG, ouvre le PDF,
compare les couleurs des SVG aux jetons et vérifie que le guide cite tous les fichiers.
`;

writeFileSync(resolve(brand, "MANIFEST.md"), md, "utf8");
console.log(`MANIFEST.md écrit (${entries.filter((e) => e.startsWith("| `")).length} fichiers)`);
