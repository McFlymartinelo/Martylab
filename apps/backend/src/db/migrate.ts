import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import dotenv from "dotenv";
import pg from "pg";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../",
);

dotenv.config({ path: path.join(rootDir, ".env") });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error(
    "[martylab-migrate] DATABASE_URL is required (Docker hostname: postgres).",
  );
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
  connectionTimeoutMillis: 10_000,
});
const db = drizzle(pool);

const migrationsFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../drizzle",
);

try {
  await migrate(db, { migrationsFolder });
  console.log("[martylab-migrate] Migrations applied successfully.");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[martylab-migrate] Migration failed: ${message}`);

  if (message.includes("password authentication failed")) {
    console.error(
      "[martylab-migrate] PostgreSQL rejected DATABASE_URL credentials.",
    );
    console.error(
      "[martylab-migrate] The postgres volume keeps the password from first deploy.",
    );
    console.error(
      "[martylab-migrate] Align DATABASE_URL with the existing password, or run:",
    );
    console.error(
      "[martylab-migrate]   ./scripts/sync-postgres-password.sh",
    );
  }

  process.exit(1);
} finally {
  await pool.end();
}
