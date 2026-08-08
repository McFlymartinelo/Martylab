import path from "node:path";
import { fileURLToPath } from "node:url";
import argon2 from "argon2";
import dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { users } from "./schema.js";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../",
);

dotenv.config({ path: path.join(rootDir, ".env") });

const databaseUrl = process.env.DATABASE_URL;
const nodeEnv = process.env.NODE_ENV ?? "development";

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required to seed users. Start Postgres via `docker compose up -d postgres`.",
  );
}

const alexandrePassword =
  process.env.SEED_ALEXANDRE_PASSWORD ??
  (nodeEnv === "development" ? "changeme-alexandre" : undefined);
const invitePassword =
  process.env.SEED_INVITE_PASSWORD ??
  (nodeEnv === "development" ? "changeme-invite" : undefined);

if (!alexandrePassword || !invitePassword) {
  throw new Error(
    "SEED_ALEXANDRE_PASSWORD and SEED_INVITE_PASSWORD are required outside development.",
  );
}

const seedUsers = [
  {
    username: "alexandre",
    displayName: "Alexandre",
    role: "admin" as const,
    password: alexandrePassword,
  },
  {
    username: "invite",
    displayName: "Invité",
    role: "guest" as const,
    password: invitePassword,
  },
];

const pool = new pg.Pool({ connectionString: databaseUrl });
const db = drizzle(pool);

try {
  for (const user of seedUsers) {
    const passwordHash = await argon2.hash(user.password);
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, user.username))
      .limit(1);

    if (existing[0]) {
      await db
        .update(users)
        .set({
          displayName: user.displayName,
          role: user.role,
          passwordHash,
        })
        .where(eq(users.id, existing[0].id));
      console.log(`Updated user: ${user.username}`);
      continue;
    }

    await db.insert(users).values({
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      passwordHash,
    });
    console.log(`Created user: ${user.username}`);
  }

  console.log("Seed completed.");
} finally {
  await pool.end();
}
