import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import type { Env } from "./config/env.js";
import type { Logger } from "./lib/logger.js";
import {
  createErrorHandler,
  notFoundHandler,
} from "./middleware/error-handler.js";
import { healthRouter } from "./routes/health.js";
import { pluginsRouter } from "./routes/plugins.js";

export function createApp(env: Env, logger: Logger) {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => req.url === "/api/health",
      },
    }),
  );

  app.use("/api/health", healthRouter);
  app.use("/api/plugins", pluginsRouter);

  app.use(notFoundHandler);
  app.use(createErrorHandler(logger, env.NODE_ENV === "production"));

  return app;
}
