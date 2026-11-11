import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const workspacePackage = JSON.parse(
  readFileSync(path.resolve(rootDir, "../../package.json"), "utf8"),
) as { version: string };

export default defineConfig(({ mode }) => {
  // Le port du backend vient du .env racine (PORT), pour que le proxy reste
  // aligné sans variable supplémentaire. MARTYLAB_DEV_API_TARGET reste
  // prioritaire si l'on veut viser une autre machine.
  const fileEnv = loadEnv(mode, path.resolve(rootDir, "../.."), "");
  const apiTarget =
    process.env.MARTYLAB_DEV_API_TARGET ??
    `http://127.0.0.1:${fileEnv.PORT ?? "3000"}`;

  return {
    define: {
      __APP_VERSION__: JSON.stringify(workspacePackage.version),
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        strategies: "injectManifest",
        srcDir: "src",
        filename: "sw.ts",
        includeAssets: ["favicon.svg", "icons/*.png"],
        manifest: {
          name: "Martylab",
          short_name: "Martylab",
          description: "Hub d'applications personnel self-hosted",
          theme_color: "#0C1116",
          background_color: "#0C1116",
          display: "standalone",
          orientation: "portrait-primary",
          start_url: "/",
          scope: "/",
          lang: "fr",
          icons: [
            {
              src: "/favicon.svg",
              sizes: "any",
              type: "image/svg+xml",
              purpose: "any",
            },
            {
              src: "/icons/icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/icons/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/icons/icon-maskable-1024.png",
              sizes: "1024x1024",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,svg,png,woff2}"],
          cleanupOutdatedCaches: true,
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(rootDir, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) {
              return;
            }

            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router")
            ) {
              return "react";
            }

            if (id.includes("@tanstack/react-query")) {
              return "query";
            }

            if (id.includes("recharts")) {
              return "charts";
            }
          },
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          // 127.0.0.1 évite de résoudre `localhost` en ::1, où un autre serveur
          // de dev (Next.js, par exemple) peut déjà écouter sur le même port.
          target: apiTarget,
          changeOrigin: true,
          // Terminal conteneur : la poignée de main WebSocket doit passer.
          ws: true,
        },
      },
    },
  };
});
