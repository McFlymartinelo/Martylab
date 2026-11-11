#!/usr/bin/env node
/**
 * Lance le backend et le portail en parallèle pour le développement local.
 *
 * `npm run dev --workspaces` exécute les scripts en série : le premier
 * (`tsx watch`) ne rend jamais la main, donc le portail ne démarrait pas.
 *
 * - stdio hérité : les logs et couleurs des deux process restent lisibles ;
 * - Ctrl+C arrête les deux arbres de process (taskkill /T sous Windows) ;
 * - si l'un meurt avec un code non nul, l'autre est arrêté et le code est
 *   propagé, pour que la tâche VS Code signale l'échec.
 */
import { spawn } from "node:child_process";

const isWindows = process.platform === "win32";

const targets = [
  { name: "backend", script: "dev:backend" },
  { name: "portal", script: "dev:portal" },
];

const children = new Map();
let shuttingDown = false;

function kill(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  if (isWindows) {
    spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
    }).on("error", () => child.kill());
    return;
  }

  child.kill("SIGTERM");
}

function shutdown(code) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  for (const child of children.values()) {
    kill(child);
  }

  process.exitCode = code;
}

for (const target of targets) {
  // Commande unique + shell : sous Windows, .cmd doit passer par le shell.
  // Éviter { args: [...] } avec shell (DEP0190) et l'échappement manuel.
  const child = spawn(`npm run ${target.script}`, {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });

  children.set(target.name, child);

  child.on("error", (error) => {
    console.error(`[dev] ${target.name} : ${error.message}`);
    shutdown(1);
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    if (signal) {
      console.error(`[dev] ${target.name} interrompu (${signal})`);
      shutdown(1);
      return;
    }

    if (code && code !== 0) {
      console.error(`[dev] ${target.name} s'est arrêté avec le code ${code}`);
      shutdown(code);
    }
  });
}

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP", "SIGBREAK"]) {
  process.on(signal, () => shutdown(0));
}
