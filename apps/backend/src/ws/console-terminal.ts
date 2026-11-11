import type { IncomingMessage, Server as HttpServer } from "node:http";
import type { Duplex } from "node:stream";
import { StringDecoder } from "node:string_decoder";
import { WebSocket, WebSocketServer } from "ws";
import type { ConsoleTerminalClientMessage } from "@martylab/shared";
import type { Env } from "../config/env.js";
import type { SessionService } from "../auth/session-service.js";
import type {
  DockerExecConnector,
  DockerExecSession,
} from "../connectors/docker/docker-exec.js";
import { isAllowedShell } from "../connectors/docker/docker-exec.js";
import type { ConsoleRepository } from "../console/console-repository.js";
import type { Logger } from "../lib/logger.js";

/**
 * Terminal conteneur (admin uniquement).
 *
 * Le navigateur ouvre un WebSocket same-origin ; le backend vérifie le cookie
 * de session et le rôle admin, puis relie le socket au flux `docker exec`.
 * Aucun accès au shell de l'hôte Debian n'est possible par ce canal : seul un
 * conteneur Docker existant peut être ouvert.
 */

const TERMINAL_PATH = "/api/console/terminal";
const CONTAINER_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/;
const MAX_IDLE_MS = 30 * 60 * 1000;
const PING_INTERVAL_MS = 30 * 1000;
const MAX_PAYLOAD = 64 * 1024;

function parseCookie(header: string | undefined, name: string): string | undefined {
  if (!header) {
    return undefined;
  }

  for (const part of header.split(";")) {
    const [rawKey, ...rest] = part.split("=");
    if (rawKey?.trim() === name) {
      return decodeURIComponent(rest.join("=").trim());
    }
  }

  return undefined;
}

function reject(socket: Duplex, status: number, message: string) {
  const statusText =
    {
      400: "Bad Request",
      401: "Unauthorized",
      403: "Forbidden",
      404: "Not Found",
      502: "Bad Gateway",
      503: "Service Unavailable",
    }[status] ?? "Error";
  const body = `${message}\n`;
  socket.write(
    `HTTP/1.1 ${status} ${statusText}\r\n` +
      "Content-Type: text/plain; charset=utf-8\r\n" +
      `Content-Length: ${Buffer.byteLength(body)}\r\n` +
      "Connection: close\r\n\r\n" +
      body,
  );
  socket.destroy();
}

function send(ws: WebSocket, message: unknown) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

export function createConsoleTerminalServer(options: {
  env: Env;
  sessionService: SessionService | null;
  dockerExec: DockerExecConnector;
  repository: ConsoleRepository | null;
  logger: Logger;
}) {
  const { env, sessionService, dockerExec, repository, logger } = options;
  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_PAYLOAD });
  let started = false;

  async function handleUpgrade(
    request: IncomingMessage,
    socket: Duplex,
    head: Buffer,
  ) {
    let pathname: string;
    try {
      pathname = new URL(request.url ?? "/", "http://localhost").pathname;
    } catch {
      reject(socket, 400, "Requête invalide.");
      return;
    }

    if (pathname !== TERMINAL_PATH) {
      reject(socket, 404, "Terminal introuvable.");
      return;
    }

    if (env.CONSOLE_TERMINAL_ENABLED === false) {
      reject(socket, 403, "Le terminal conteneur est désactivé.");
      return;
    }

    if (!dockerExec.isConfigured || !sessionService) {
      reject(socket, 503, "Terminal indisponible sur ce serveur.");
      return;
    }

    // Anti-CSRF WebSocket : l'Origin doit correspondre exactement au portail.
    const origin = request.headers.origin;
    if (!origin || origin !== env.CORS_ORIGIN) {
      reject(socket, 403, "Origine non autorisée.");
      return;
    }

    let resolved: Awaited<ReturnType<SessionService["resolveSession"]>>;
    try {
      const token = parseCookie(
        request.headers.cookie,
        env.SESSION_COOKIE_NAME,
      );
      resolved = await sessionService.resolveSession(token);
    } catch (error) {
      logger.error({ err: error }, "Terminal session resolution failed");
      reject(socket, 503, "Session indisponible.");
      return;
    }

    if (!resolved) {
      reject(socket, 401, "Authentification requise.");
      return;
    }
    if (resolved.user.role !== "admin") {
      reject(socket, 403, "Réservé aux administrateurs.");
      return;
    }

    const url = new URL(request.url ?? "/", "http://localhost");
    const containerId = url.searchParams.get("container") ?? "";
    const shell =
      url.searchParams.get("shell") ?? "/bin/sh";
    const cols = Number.parseInt(url.searchParams.get("cols") ?? "80", 10);
    const rows = Number.parseInt(url.searchParams.get("rows") ?? "24", 10);

    if (!CONTAINER_ID_PATTERN.test(containerId)) {
      reject(socket, 400, "Conteneur invalide.");
      return;
    }
    if (!isAllowedShell(shell)) {
      reject(socket, 400, "Shell non autorisé.");
      return;
    }

    const actor = resolved.user;
    const safeCols = Number.isFinite(cols) ? Math.min(Math.max(cols, 20), 300) : 80;
    const safeRows = Number.isFinite(rows) ? Math.min(Math.max(rows, 5), 120) : 24;

    logger.info(
      { username: actor.username, containerId, shell },
      "Console terminal requested",
    );

    let execSession: DockerExecSession;
    try {
      execSession = await dockerExec.openSession({
        containerId,
        shell,
        cols: safeCols,
        rows: safeRows,
      });
    } catch (error) {
      logger.warn(
        { err: error, containerId },
        "Unable to open container terminal",
      );
      reject(socket, 502, "Impossible d'ouvrir le terminal du conteneur.");
      return;
    }

    logger.info({ containerId, execId: execSession.execId }, "Docker exec opened");

    wss.handleUpgrade(request, socket, head, (ws) => {
      logger.info(
        { containerId, execId: execSession.execId },
        "Console terminal connected",
      );
      const startedAt = Date.now();
      const decoder = new StringDecoder("utf8");
      let closed = false;
      let lastActivity = Date.now();
      let idleTimer: NodeJS.Timeout | undefined;
      let pingTimer: NodeJS.Timeout | undefined;

      function finish(reason: string) {
        if (closed) {
          return;
        }
        closed = true;
        if (idleTimer) clearInterval(idleTimer);
        if (pingTimer) clearInterval(pingTimer);
        execSession.close();
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
        if (repository) {
          void repository
            .record({
              userId: actor.id,
              username: actor.username,
              command: `terminal ${containerId} ${shell}`,
              status: "success",
              risk: "destructive",
              outputPreview: `Session terminée (${reason}) après ${Math.round((Date.now() - startedAt) / 1000)} s.`,
              durationMs: Date.now() - startedAt,
            })
            .catch((error: unknown) => {
              logger.error(
                { err: error },
                "Unable to write terminal audit entry",
              );
            });
        }
      }

      idleTimer = setInterval(() => {
        if (Date.now() - lastActivity > MAX_IDLE_MS) {
          send(ws, {
            type: "error",
            message: "Session fermée après 30 minutes d'inactivité.",
          });
          finish("inactivité");
        }
      }, 60_000);
      pingTimer = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      }, PING_INTERVAL_MS);

      ws.on("message", (raw) => {
        lastActivity = Date.now();

        let message: ConsoleTerminalClientMessage;
        try {
          message = JSON.parse(raw.toString()) as ConsoleTerminalClientMessage;
        } catch {
          return;
        }

        if (message.type === "input" && typeof message.data === "string") {
          execSession.stream.write(message.data);
          return;
        }

        if (message.type === "resize") {
          const nextCols = Number(message.cols);
          const nextRows = Number(message.rows);
          if (Number.isFinite(nextCols) && Number.isFinite(nextRows)) {
            void dockerExec
              .resize(
                execSession.execId,
                Math.min(Math.max(nextCols, 20), 300),
                Math.min(Math.max(nextRows, 5), 120),
              )
              .catch(() => {
                // Redimensionnement best-effort.
              });
          }
        }
      });

      execSession.stream.on("data", (chunk: Buffer) => {
        lastActivity = Date.now();
        send(ws, { type: "output", data: decoder.write(chunk) });
      });

      execSession.stream.on("end", () => {
        const tail = decoder.end();
        if (tail) {
          send(ws, { type: "output", data: tail });
        }
        send(ws, { type: "exit", code: null });
        finish("fin de processus");
      });

      execSession.stream.on("error", (error) => {
        logger.warn({ err: error, containerId }, "Terminal stream error");
        send(ws, { type: "error", message: "Flux du terminal interrompu." });
        finish("erreur de flux");
      });

      // `end` n'est pas toujours émis quand le socket est détruit par Docker.
      execSession.stream.on("close", () => finish("flux fermé"));

      ws.on("close", () => finish("déconnexion"));
      ws.on("error", (error) => {
        logger.warn({ err: error }, "Terminal websocket error");
        finish("erreur websocket");
      });

      send(ws, { type: "ready", container: containerId });
      if (repository) {
        void repository
          .record({
            userId: actor.id,
            username: actor.username,
            command: `terminal ${containerId} ${shell}`,
            status: "success",
            risk: "destructive",
            outputPreview: "Ouverture d'une session terminal.",
            durationMs: null,
          })
          .catch((error: unknown) => {
            logger.error({ err: error }, "Unable to write terminal audit entry");
          });
      }
    });
  }

  return {
    attach(server: HttpServer) {
      if (started) {
        return;
      }
      started = true;

      server.on("upgrade", (request, socket, head) => {
        void handleUpgrade(request, socket, head);
      });
    },

    close() {
      wss.close();
    },
  };
}

export type ConsoleTerminalServer = ReturnType<
  typeof createConsoleTerminalServer
>;
