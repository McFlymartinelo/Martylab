import { and, eq, gt, isNull } from "drizzle-orm";
import type { SessionUser, UserRole } from "@martylab/shared";
import type { Env } from "../config/env.js";
import type { Database } from "../db/client.js";
import { sessions, users } from "../db/schema.js";
import { AppError } from "../lib/errors.js";
import { createSessionToken, hashSessionToken } from "./session-token.js";
import { verifyPassword } from "./password.js";

function toSessionUser(row: {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
}): SessionUser {
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    role: row.role,
  };
}

export function createSessionService(db: NonNullable<Database>, env: Env) {
  const sessionSecret = env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET is required for session service.");
  }

  return {
    async login(input: {
      username: string;
      password: string;
      userAgent?: string;
      ipAddress?: string;
    }) {
      const normalizedUsername = input.username.trim().toLowerCase();
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, normalizedUsername))
        .limit(1);

      if (!user) {
        // Mitigate user enumeration timing differences.
        await verifyPassword(
          "$argon2id$v=19$m=65536,t=3,p=4$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          input.password,
        );
        throw new AppError(401, "invalid_credentials", "Invalid credentials.");
      }

      const valid = await verifyPassword(user.passwordHash, input.password);
      if (!valid) {
        throw new AppError(401, "invalid_credentials", "Invalid credentials.");
      }

      const token = createSessionToken();
      const tokenHash = hashSessionToken(token, sessionSecret);
      const expiresAt = new Date(
        Date.now() + env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
      );

      const [session] = await db
        .insert(sessions)
        .values({
          userId: user.id,
          tokenHash,
          expiresAt,
          ...(input.userAgent ? { userAgent: input.userAgent } : {}),
          ...(input.ipAddress ? { ipAddress: input.ipAddress } : {}),
        })
        .returning({ id: sessions.id });

      if (!session) {
        throw new AppError(
          500,
          "session_create_failed",
          "Unable to create session.",
        );
      }

      return {
        token,
        sessionId: session.id,
        user: toSessionUser(user),
      };
    },

    async resolveSession(token: string | undefined) {
      if (!token) {
        return null;
      }

      const tokenHash = hashSessionToken(token, sessionSecret);
      const now = new Date();

      const [row] = await db
        .select({
          sessionId: sessions.id,
          expiresAt: sessions.expiresAt,
          revokedAt: sessions.revokedAt,
          userId: users.id,
          username: users.username,
          displayName: users.displayName,
          role: users.role,
        })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(
          and(
            eq(sessions.tokenHash, tokenHash),
            isNull(sessions.revokedAt),
            gt(sessions.expiresAt, now),
          ),
        )
        .limit(1);

      if (!row) {
        return null;
      }

      return {
        sessionId: row.sessionId,
        user: toSessionUser({
          id: row.userId,
          username: row.username,
          displayName: row.displayName,
          role: row.role,
        }),
      };
    },

    async revokeSession(sessionId: string) {
      await db
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(eq(sessions.id, sessionId));
    },
  };
}

export type SessionService = ReturnType<typeof createSessionService>;
