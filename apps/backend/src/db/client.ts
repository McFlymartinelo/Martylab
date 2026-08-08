import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import type { Env } from "../config/env.js";
import type { Logger } from "../lib/logger.js";
import * as schema from "./schema.js";

export type Database = ReturnType<typeof createDatabase>["db"];

export function createDatabase(env: Env, logger: Logger) {
  if (!env.DATABASE_URL) {
    return {
      db: null,
      pool: null,
      async ping() {
        return "not_configured" as const;
      },
      async close() {
        return;
      },
    };
  }

  const pool = new pg.Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
  });

  pool.on("error", (error) => {
    logger.error({ err: error }, "Unexpected PostgreSQL pool error");
  });

  const db = drizzle(pool, { schema });

  return {
    db,
    pool,
    async ping() {
      try {
        await pool.query("select 1");
        return "up" as const;
      } catch (error) {
        logger.warn({ err: error }, "PostgreSQL ping failed");
        return "down" as const;
      }
    },
    async close() {
      await pool.end();
    },
  };
}
