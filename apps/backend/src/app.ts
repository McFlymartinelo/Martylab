import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { createSessionService } from "./auth/session-service.js";
import type { Env } from "./config/env.js";
import type { createDatabase } from "./db/client.js";
import type { Logger } from "./lib/logger.js";
import {
  createErrorHandler,
  notFoundHandler,
} from "./middleware/error-handler.js";
import {
  createOriginGuard,
  createSessionMiddleware,
  requireAuth,
} from "./middleware/auth.js";
import { createAuthRouter } from "./routes/auth.js";
import { createDockerRouter } from "./routes/docker.js";
import { createHealthRouter } from "./routes/health.js";
import { pluginsRouter } from "./routes/plugins.js";
import { createSystemRouter } from "./routes/system.js";
import { createUsersRouter } from "./routes/users.js";
import { createOrionRouter } from "./routes/orion.js";
import { createDockerClient } from "./connectors/docker/docker-client.js";
import { createOrionClient } from "./connectors/orion/orion-client.js";
import { createServerMetricsService } from "./connectors/server/server-metrics.js";
import { createUserService } from "./users/user-service.js";

type DatabaseHandle = ReturnType<typeof createDatabase>;

export function createApp(env: Env, logger: Logger, database: DatabaseHandle) {
  const app = express();
  const sessionService = database.db
    ? createSessionService(database.db, env)
    : null;
  const userService = database.db ? createUserService(database.db) : null;
  const serverMetrics = createServerMetricsService({
    hostProcPrefix: env.HOST_PROC_PREFIX,
    hostSysPrefix: env.HOST_SYS_PREFIX,
    hostRootPath: env.HOST_ROOT_PATH,
  });
  const dockerClient = createDockerClient(env.DOCKER_SOCKET_PATH);
  const orionClient = createOrionClient({
    baseUrl: env.ORION_URL,
    apiKey: env.ORION_API_KEY,
    timeoutMs: env.ORION_TIMEOUT_MS,
  });

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(createOriginGuard(env));
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) =>
          req.url === "/api/health" || req.url === "/api/health/live",
      },
    }),
  );
  app.use(createSessionMiddleware(env, sessionService));

  app.use("/api/health", createHealthRouter(database));
  app.use("/api/auth", createAuthRouter(env, sessionService));
  app.use("/api/plugins", requireAuth, pluginsRouter);
  app.use("/api/users", createUsersRouter(userService));
  app.use("/api/system", createSystemRouter(serverMetrics));
  app.use("/api/docker", createDockerRouter(dockerClient));
  app.use("/api/orion", createOrionRouter(orionClient));

  app.use(notFoundHandler);
  app.use(createErrorHandler(logger, env.NODE_ENV === "production"));

  return app;
}
