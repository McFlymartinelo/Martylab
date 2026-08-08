import { loadEnv } from "./config/env.js";
import { createApp } from "./app.js";
import { createDatabase } from "./db/client.js";
import { createLogger } from "./lib/logger.js";
import { bootstrapPlugins } from "./plugins/bootstrap.js";

const env = loadEnv();
const logger = createLogger(env);
const database = createDatabase(env, logger);
bootstrapPlugins();
const app = createApp(env, logger, database);

const server = app.listen(env.PORT, env.HOST, () => {
  logger.info(
    {
      host: env.HOST,
      port: env.PORT,
      env: env.NODE_ENV,
      corsOrigin: env.CORS_ORIGIN,
      databaseConfigured: Boolean(env.DATABASE_URL),
    },
    "Martylab backend listening",
  );
});

async function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down backend");

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  }).catch((error: unknown) => {
    logger.error({ err: error }, "Error while closing HTTP server");
  });

  await database.close();
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
