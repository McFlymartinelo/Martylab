import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const brand = resolve(process.cwd(), "docs/brand");
const resvgPath = `${process.env.TEMP}\\brandtools\\node_modules\\@resvg\\resvg-js\\index.js`;
const { Resvg } = await import(new URL(`file:///${resvgPath.replace(/\\/g, "/")}`).href);

function png(svg, width, background, out) {
  const r = new Resvg(svg, { fitTo: { mode: "width", value: width }, background });
  writeFileSync(out, r.render().asPng());
  console.log(out);
}

const light = readFileSync(resolve(brand, "assets/logo/martylab-logo-horizontal.svg"), "utf8");
const dark = readFileSync(resolve(brand, "assets/logo/martylab-logo-horizontal-dark.svg"), "utf8");
const stacked = readFileSync(resolve(brand, "assets/logo/martylab-logo-stacked.svg"), "utf8");
const symbol = readFileSync(resolve(brand, "assets/logo/martylab-symbol.svg"), "utf8");
const icon = readFileSync(resolve(brand, "assets/icons/martylab-app-icon.svg"), "utf8");
const mono = readFileSync(resolve(brand, "assets/logo/martylab-logo-horizontal-mono-black.svg"), "utf8");

const tmp = `${process.env.TEMP}\\brandtools\\preview`;
png(light, 700, "#F2F7FA", `${tmp}-horiz-light.png`);
png(dark, 700, "#0C1116", `${tmp}-horiz-dark.png`);
png(stacked, 320, "#F2F7FA", `${tmp}-stacked.png`);
png(symbol, 160, "#F2F7FA", `${tmp}-symbol.png`);
png(mono, 500, "#F2F7FA", `${tmp}-mono.png`);
png(icon, 256, "rgba(0,0,0,0)", `${tmp}-icon.png`);
