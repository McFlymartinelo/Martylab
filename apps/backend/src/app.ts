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
import { createHealthRouter } from "./routes/health.js";
import { pluginsRouter } from "./routes/plugins.js";

type DatabaseHandle = ReturnType<typeof createDatabase>;

export function createApp(env: Env, logger: Logger, database: DatabaseHandle) {
  const app = express();
  const sessionService = database.db
    ? createSessionService(database.db, env)
    : null;

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
        ignore: (req) => req.url === "/api/health",
      },
    }),
  );
  app.use(createSessionMiddleware(env, sessionService));

  app.use("/api/health", createHealthRouter(database));
  app.use("/api/auth", createAuthRouter(env, sessionService));
  app.use("/api/plugins", requireAuth, pluginsRouter);

  app.use(notFoundHandler);
  app.use(createErrorHandler(logger, env.NODE_ENV === "production"));

  return app;
}
