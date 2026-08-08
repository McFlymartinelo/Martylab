import { loadEnv } from "./config/env.js";
import { createApp } from "./app.js";
import { createDatabase } from "./db/client.js";
import { createLogger } from "./lib/logger.js";
import { bootstrapPlugins } from "./plugins/bootstrap.js";

try {
  const env = loadEnv();
  const logger = createLogger(env);
  const database = createDatabase(env, logger);
  await bootstrapPlugins(env);
  const app = createApp(env, logger, database);

  const server = app.listen(env.PORT, env.HOST, () => {
    logger.info(
      {
        host: env.HOST,
        port: env.PORT,
        env: env.NODE_ENV,
        corsOrigin: env.CORS_ORIGIN,
        databaseConfigured: Boolean(env.DATABASE_URL),
        orionConfigured: Boolean(env.ORION_URL),
        matchdayConfigured: Boolean(env.MATCHDAY_URL && env.MATCHDAY_GROUP_ID),
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
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[martylab-backend] Failed to start: ${message}`);
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
}
