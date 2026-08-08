import { loadEnv } from "./config/env.js";
import { createApp } from "./app.js";
import { createLogger } from "./lib/logger.js";

const env = loadEnv();
const logger = createLogger(env);
const app = createApp(env, logger);

const server = app.listen(env.PORT, env.HOST, () => {
  logger.info(
    {
      host: env.HOST,
      port: env.PORT,
      env: env.NODE_ENV,
      corsOrigin: env.CORS_ORIGIN,
    },
    "Martylab backend listening",
  );
});

function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down backend");
  server.close((error) => {
    if (error) {
      logger.error({ err: error }, "Error during shutdown");
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
