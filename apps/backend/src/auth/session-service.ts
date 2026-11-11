import { and, desc, eq, gt, isNull, ne } from "drizzle-orm";
import type { AuthSessionEntry, SessionUser, UserRole } from "@martylab/shared";
import type { Env } from "../config/env.js";
import type { Database } from "../db/client.js";
import { sessions, userBackupCodes, users } from "../db/schema.js";
import { AppError } from "../lib/errors.js";
import { createSessionToken, hashSessionToken } from "./session-token.js";
import { verifyPassword } from "./password.js";
import {
  createMfaChallengeToken,
  verifyMfaChallengeToken,
} from "./mfa-challenge.js";
import { backupCodeMatches, decryptTotpSecret, verifyTotp } from "./totp.js";

interface UserRow {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  createdAt: Date;
  totpEnabledAt: Date | null;
}

function toSessionUser(row: UserRow): SessionUser {
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    role: row.role,
    createdAt: row.createdAt.toISOString(),
    mfaEnabled: row.totpEnabledAt !== null,
  };
}

export function createSessionService(db: NonNullable<Database>, env: Env) {
  const { SESSION_SECRET } = env;
  if (!SESSION_SECRET) {
    throw new Error("SESSION_SECRET is required for session service.");
  }
  const sessionSecret: string = SESSION_SECRET;

  async function issueSession(
    user: UserRow,
    input: { userAgent?: string; ipAddress?: string },
    mfaVerified: boolean,
  ) {
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
        mfaVerified,
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
  }

  /** Consomme un code de secours. L'UPDATE conditionnel rend l'usage unique. */
  async function consumeBackupCode(
    userId: string,
    code: string,
  ): Promise<boolean> {
    const rows = await db
      .select({ id: userBackupCodes.id, codeHash: userBackupCodes.codeHash })
      .from(userBackupCodes)
      .where(
        and(
          eq(userBackupCodes.userId, userId),
          isNull(userBackupCodes.usedAt),
        ),
      );

    const match = rows.find((row) =>
      backupCodeMatches(code, row.codeHash, sessionSecret),
    );
    if (!match) {
      return false;
    }

    const updated = await db
      .update(userBackupCodes)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(userBackupCodes.id, match.id),
          isNull(userBackupCodes.usedAt),
        ),
      )
      .returning({ id: userBackupCodes.id });

    return updated.length > 0;
  }

  return {
    /**
     * Étape 1. Le mot de passe seul n'ouvre une session que si aucun second
     * facteur n'est activé sur le compte.
     */
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

      if (user.totpSecret && user.totpEnabledAt) {
        return {
          status: "mfa_required" as const,
          challengeToken: createMfaChallengeToken(user.id, sessionSecret),
        };
      }

      const issued = await issueSession(user, input, false);
      return { status: "ok" as const, ...issued };
    },

    /** Étape 2. Code TOTP ou code de secours, puis ouverture de session. */
    async verifyMfa(input: {
      challengeToken: string;
      code: string;
      userAgent?: string;
      ipAddress?: string;
    }) {
      const challenge = verifyMfaChallengeToken(
        input.challengeToken,
        sessionSecret,
      );
      if (!challenge) {
        throw new AppError(
          401,
          "mfa_challenge_invalid",
          "Défi expiré. Reconnecte-toi.",
        );
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, challenge.userId))
        .limit(1);

      if (!user || !user.totpSecret || !user.totpEnabledAt) {
        throw new AppError(
          401,
          "mfa_not_enabled",
          "Authentification à deux facteurs indisponible pour ce compte.",
        );
      }

      const secret = decryptTotpSecret(user.totpSecret, sessionSecret);
      if (!secret) {
        // SESSION_SECRET a probablement changé depuis l'enrôlement.
        throw new AppError(
          500,
          "mfa_secret_unreadable",
          "Secret du second facteur illisible. Réenrôle l'authentification à deux facteurs.",
          { isOperational: false },
        );
      }

      const code = input.code.trim();
      let usedBackupCode = false;
      let valid = verifyTotp(secret, code);

      if (!valid) {
        valid = await consumeBackupCode(user.id, code);
        usedBackupCode = valid;
      }

      if (!valid) {
        throw new AppError(401, "invalid_mfa_code", "Code invalide.");
      }

      const issued = await issueSession(user, input, true);
      return { ...issued, usedBackupCode };
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
          mfaVerified: sessions.mfaVerified,
          userId: users.id,
          username: users.username,
          displayName: users.displayName,
          role: users.role,
          createdAt: users.createdAt,
          totpEnabledAt: users.totpEnabledAt,
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
        mfaVerified: row.mfaVerified,
        user: toSessionUser({
          id: row.userId,
          username: row.username,
          displayName: row.displayName,
          role: row.role,
          createdAt: row.createdAt,
          totpEnabledAt: row.totpEnabledAt,
        }),
      };
    },

    async revokeSession(sessionId: string) {
      await db
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(eq(sessions.id, sessionId));
    },

    /** Marque la session courante comme vérifiée par un second facteur. */
    async markSessionMfaVerified(sessionId: string) {
      await db
        .update(sessions)
        .set({ mfaVerified: true })
        .where(eq(sessions.id, sessionId));
    },

    /**
     * Retire le marqueur « second facteur vérifié » de toutes les sessions de
     * l'utilisateur. Appelé à la désactivation du 2FA : sans second facteur
     * actif, plus aucune session ne doit ouvrir le terminal.
     */
    async clearMfaVerification(userId: string) {
      await db
        .update(sessions)
        .set({ mfaVerified: false })
        .where(eq(sessions.userId, userId));
    },

    /**
     * Révoque toutes les sessions non vérifiées par un second facteur.
     * Appelé après l'activation du 2FA : une session ouverte avec le seul
     * mot de passe ne doit pas survivre à l'activation.
     */
    async revokeUnverifiedSessions(userId: string, exceptSessionId: string) {
      await db
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(sessions.userId, userId),
            eq(sessions.mfaVerified, false),
            ne(sessions.id, exceptSessionId),
            isNull(sessions.revokedAt),
          ),
        );
    },

    async listSessions(
      userId: string,
      currentSessionId: string,
    ): Promise<AuthSessionEntry[]> {
      const now = new Date();
      const rows = await db
        .select({
          id: sessions.id,
          createdAt: sessions.createdAt,
          expiresAt: sessions.expiresAt,
          userAgent: sessions.userAgent,
          ipAddress: sessions.ipAddress,
          mfaVerified: sessions.mfaVerified,
        })
        .from(sessions)
        .where(
          and(
            eq(sessions.userId, userId),
            isNull(sessions.revokedAt),
            gt(sessions.expiresAt, now),
          ),
        )
        .orderBy(desc(sessions.createdAt));

      return rows.map((row) => ({
        id: row.id,
        createdAt: row.createdAt.toISOString(),
        expiresAt: row.expiresAt.toISOString(),
        userAgent: row.userAgent,
        ipAddress: row.ipAddress,
        mfaVerified: row.mfaVerified,
        current: row.id === currentSessionId,
      }));
    },

    /** Revokes one of the user's own sessions; no-op if it is not theirs. */
    async revokeUserSession(userId: string, sessionId: string) {
      await db
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));
    },

    /** Revokes every active session of the user except the current one. */
    async revokeOtherSessions(userId: string, currentSessionId: string) {
      await db
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(sessions.userId, userId),
            ne(sessions.id, currentSessionId),
            isNull(sessions.revokedAt),
          ),
        );
    },
  };
}

export type SessionService = ReturnType<typeof createSessionService>;
