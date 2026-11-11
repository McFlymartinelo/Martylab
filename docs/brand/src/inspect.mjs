import { readFileSync } from "node:fs";
const p = JSON.parse(readFileSync(new URL("./generated/palette.json", import.meta.url)));
for (const m of ["light", "dark"]) {
  console.log("--- " + m);
  for (const [k, v] of Object.entries(p.tokens[m])) {
    console.log(k.padEnd(20), v.hex, `rgb(${v.rgb.r}, ${v.rgb.g}, ${v.rgb.b})`);
  }
}
console.log("--- checks");
for (const c of p.checks) {
  console.log(c.mode.padEnd(6), c.label.padEnd(40), String(c.ratio).padStart(6), c.target, c.pass ? "ok" : "FAIL");
}
