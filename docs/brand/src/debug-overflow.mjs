import { readFileSync, writeFileSync } from "node:fs";

const html = readFileSync("docs/brand/src/generated/guide.html", "utf8");
const style = html.match(/<style>[\s\S]*?<\/style>/)[0];
const parts = html.split(/(?=<section class="page)/);
const idx = Number(process.argv[2] ?? 8) - 1;
const section = parts.find((p) => p.trim().startsWith('<section class="page')) ? null : null;
const pages = parts.filter((p) => p.includes('<section class="page'));
const page = pages[idx];

const debug = `<!doctype html><html><head><meta charset="utf-8">${style}</head><body>
${page}
<script>
  const limit = document.documentElement.clientWidth;
  const bad = [];
  for (const el of document.querySelectorAll("section *")) {
    const r = el.getBoundingClientRect();
    if (r.right > limit + 0.5 || r.left < -0.5) {
      bad.push(el.tagName + "." + el.className + " right=" + Math.round(r.right) + " left=" + Math.round(r.left));
    }
  }
  document.title = "W=" + limit + " scroll=" + document.documentElement.scrollWidth + " || " + bad.slice(0, 12).join(" | ");
</script></body></html>`;
writeFileSync("docs/brand/src/generated/debug.html", debug, "utf8");
console.log("debug written for page", idx + 1, "sections:", pages.length);
