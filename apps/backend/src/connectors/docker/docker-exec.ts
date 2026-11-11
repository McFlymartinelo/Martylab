import http from "node:http";
import type { Duplex } from "node:stream";

/**
 * Client minimal pour `docker exec` sur le socket Unix.
 *
 * Aucune dépendance externe : Docker expose un flux brut après un `101
 * UPGRADED`, on récupère directement le socket TCP/Unix pour le relier au
 * WebSocket. Le conteneur et le shell sont toujours validés en amont par
 * l'appelant (allowlist), jamais concaténés dans une commande shell.
 */

const SHELL_ALLOWLIST = new Set([
  "/bin/sh",
  "/bin/bash",
  "/bin/ash",
  "/usr/bin/sh",
  "/usr/bin/bash",
]);

export function isAllowedShell(shell: string): boolean {
  return SHELL_ALLOWLIST.has(shell);
}

export const ALLOWED_SHELLS = [...SHELL_ALLOWLIST];

interface ExecCreateResult {
  Id: string;
}

interface DockerExecStartOptions {
  containerId: string;
  shell: string;
  cols: number;
  rows: number;
}

export interface DockerExecSession {
  execId: string;
  stream: Duplex;
  close: () => void;
}

function dockerJsonRequest(
  socketPath: string,
  apiPath: string,
  body: unknown,
): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const request = http.request(
      {
        socketPath,
        path: apiPath,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          Accept: "application/json",
        },
      },
      (response) => {
        let text = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          text += chunk;
        });
        response.on("end", () =>
          resolve({ statusCode: response.statusCode ?? 500, body: text }),
        );
      },
    );

    request.on("error", reject);
    request.end(payload);
  });
}

function resizeExec(
  socketPath: string,
  execId: string,
  cols: number,
  rows: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        socketPath,
        path: `/exec/${encodeURIComponent(execId)}/resize?h=${Math.max(1, Math.floor(rows))}&w=${Math.max(1, Math.floor(cols))}`,
        method: "POST",
      },
      (response) => {
        response.resume();
        response.on("end", () => resolve());
      },
    );
    request.on("error", reject);
    request.end();
  });
}

function startExecStream(
  socketPath: string,
  execId: string,
  cols: number,
  rows: number,
): Promise<Duplex> {
  return new Promise((resolve, reject) => {
    // `ConsoleSize` initialise le PTY dès le démarrage. Appeler `/resize`
    // avant `/start` bloque côté Docker (« timeout waiting for exec session
    // ready »), donc la taille initiale passe par ce champ.
    const payload = JSON.stringify({
      Detach: false,
      Tty: true,
      ConsoleSize: [
        Math.max(1, Math.floor(rows)),
        Math.max(1, Math.floor(cols)),
      ],
    });
    const request = http.request(
      {
        socketPath,
        path: `/exec/${encodeURIComponent(execId)}/start`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          Connection: "Upgrade",
          Upgrade: "tcp",
        },
      },
      (response) => {
        let text = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          text += chunk;
        });
        response.on("end", () => {
          reject(
            new Error(
              `Docker exec refused (${response.statusCode ?? "?"}): ${text.slice(0, 200)}`,
            ),
          );
        });
      },
    );

    request.on("upgrade", (_response, socket) => {
      socket.setNoDelay(true);
      resolve(socket);
    });
    request.on("error", reject);
    request.end(payload);
  });
}

export function createDockerExecConnector(socketPath: string | undefined) {
  const isConfigured = Boolean(socketPath);

  return {
    isConfigured,

    async openSession(
      options: DockerExecStartOptions,
    ): Promise<DockerExecSession> {
      if (!socketPath) {
        throw new Error("Docker socket is not configured.");
      }
      if (!isAllowedShell(options.shell)) {
        throw new Error("Shell not allowed.");
      }

      const created = await dockerJsonRequest(
        socketPath,
        `/containers/${encodeURIComponent(options.containerId)}/exec`,
        {
          AttachStdin: true,
          AttachStdout: true,
          AttachStderr: true,
          Tty: true,
          Env: ["TERM=xterm-256color"],
          Cmd: [options.shell],
        },
      );

      if (created.statusCode >= 400) {
        throw new Error(
          `Docker exec creation failed (${created.statusCode}): ${created.body.slice(0, 200)}`,
        );
      }

      let execId: string;
      try {
        execId = (JSON.parse(created.body) as ExecCreateResult).Id;
      } catch {
        throw new Error("Docker exec creation returned invalid JSON.");
      }
      if (!execId) {
        throw new Error("Docker exec creation returned no id.");
      }

      const stream = await startExecStream(
        socketPath,
        execId,
        options.cols,
        options.rows,
      );

      return {
        execId,
        stream,
        close: () => {
          stream.destroy();
        },
      };
    },

    async resize(execId: string, cols: number, rows: number) {
      if (!socketPath) {
        return;
      }
      await resizeExec(socketPath, execId, cols, rows);
    },
  };
}

export type DockerExecConnector = ReturnType<
  typeof createDockerExecConnector
>;
