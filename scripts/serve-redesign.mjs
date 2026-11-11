/**
 * Serveur statique minimal pour le prototype de refonte.
 * Usage : node scripts/serve-redesign.mjs [port]
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";

const root = resolve(process.cwd(), "docs/redesign");
const port = Number(process.argv[2] || 4173);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json",
  ".woff2": "font/woff2",
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://localhost:${port}`);
    let file = resolve(root, decodeURIComponent(url.pathname).replace(/^\/+/, ""));
    if (!file.startsWith(root)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    try {
      const info = await stat(file);
      if (info.isDirectory()) file = resolve(file, "index.html");
    } catch {
      file = resolve(root, "index.html");
    }
    const body = await readFile(file);
    res.writeHead(200, { "content-type": mime[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch (error) {
    res.writeHead(500).end(String(error));
  }
}).listen(port, () => {
  console.log(`Prototype Martylab : http://localhost:${port}`);
});
