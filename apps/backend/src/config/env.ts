import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../",
);

dotenv.config({ path: path.join(rootDir, ".env") });

const DEFAULT_DEV_SESSION_SECRET =
  "dev-only-martylab-session-secret-change-me";

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (value === "true" || value === "1") {
    return true;
  }
  if (value === "false" || value === "0") {
    return false;
  }
  return value;
}, z.boolean().optional());

function parseOptionalUrl(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  let trimmed = value.trim().replace(/^["']|["']$/g, "");
  if (!trimmed) {
    return undefined;
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  const parsed = z.string().url().safeParse(trimmed);
  return parsed.success ? parsed.data : undefined;
}

function trimEnvString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim().replace(/^["']|["']$/g, "");
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseOptionalPositiveInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),
  CORS_ORIGIN: z.preprocess(trimEnvString, z.string().min(1)).default("http://localhost:5173"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  DATABASE_URL: z.preprocess(trimEnvString, z.string().min(1).optional()),
  SESSION_SECRET: z.preprocess(trimEnvString, z.string().min(32).optional()),
  SESSION_COOKIE_NAME: z.string().min(1).default("martylab_session"),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(7),
  COOKIE_SECURE: booleanFromEnv,
  HOST_PROC_PREFIX: z.string().optional(),
  HOST_SYS_PREFIX: z.string().optional(),
  HOST_ROOT_PATH: z.string().optional(),
  DOCKER_SOCKET_PATH: z.string().optional(),
  ORION_URL: z.preprocess(parseOptionalUrl, z.string().url().optional()),
  ORION_API_KEY: z.preprocess(trimEnvString, z.string().optional()),
  ORION_TIMEOUT_MS: z.coerce.number().int().positive().default(6000),
  PLUGINS_DIR: z.string().optional(),
  MATCHDAY_URL: z.preprocess(parseOptionalUrl, z.string().url().optional()),
  MATCHDAY_PUBLIC_URL: z.preprocess(parseOptionalUrl, z.string().url().optional()),
  MATCHDAY_GROUP_ID: z.preprocess(
    parseOptionalPositiveInt,
    z.number().int().positive().optional(),
  ),
  MATCHDAY_SERVICE_USERNAME: z.preprocess(trimEnvString, z.string().optional()),
  MATCHDAY_SERVICE_PASSWORD: z.preprocess(trimEnvString, z.string().optional()),
  MATCHDAY_USER_PASSWORDS: z.preprocess(trimEnvString, z.string().optional()),
  MATCHDAY_TIMEOUT_MS: z.coerce.number().int().positive().default(6000),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(processEnv: NodeJS.ProcessEnv = process.env): Env {
  const rawOrionUrl = processEnv.ORION_URL;
  const parsed = envSchema.safeParse(processEnv);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  const env = parsed.data;

  if (
    typeof rawOrionUrl === "string" &&
    rawOrionUrl.trim().length > 0 &&
    !env.ORION_URL
  ) {
    console.warn(
      `[config] Ignoring invalid ORION_URL value: ${rawOrionUrl.trim()}`,
    );
  }

  if (env.NODE_ENV === "production" && !env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required in production.");
  }

  if (env.NODE_ENV === "production" && !env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is required in production.");
  }

  if (
    env.MATCHDAY_URL &&
    env.MATCHDAY_GROUP_ID &&
    (!env.MATCHDAY_SERVICE_USERNAME || !env.MATCHDAY_SERVICE_PASSWORD)
  ) {
    console.warn(
      "[config] MATCHDAY_URL is set but service credentials are missing — summary will be unavailable.",
    );
  }

  return {
    ...env,
    SESSION_SECRET: env.SESSION_SECRET ?? DEFAULT_DEV_SESSION_SECRET,
    COOKIE_SECURE: env.COOKIE_SECURE ?? env.NODE_ENV === "production",
  };
}
