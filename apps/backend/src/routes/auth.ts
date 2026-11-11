import { Router } from "express";
import { z } from "zod";
import type {
  AuthResponse,
  AuthSessionsResponse,
  LoginResponse,
  MfaBackupCodesResponse,
  MfaEnableResponse,
  MfaSetupResponse,
  MfaStatusResponse,
} from "@martylab/shared";
import type { Env } from "../config/env.js";
import type { SessionService } from "../auth/session-service.js";
import type { MfaService } from "../auth/mfa-service.js";
import {
  clearSessionCookie,
  setSessionCookie,
} from "../auth/cookies.js";
import { AppError } from "../lib/errors.js";
import {
  requireAuth,
  requireDatabaseConfigured,
} from "../middleware/auth.js";

const loginSchema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(200),
});

const codeSchema = z.string().trim().min(6).max(24);
const passwordSchema = z.string().min(1).max(200);

const mfaVerifySchema = z.object({
  challengeToken: z.string().min(1).max(1024),
  code: codeSchema,
});

const mfaSetupSchema = z.object({ password: passwordSchema });
const mfaEnableSchema = z.object({ code: codeSchema });
const mfaDisableSchema = z.object({ password: passwordSchema });
const mfaBackupCodesSchema = z.object({ code: codeSchema });

export function createAuthRouter(
  env: Env,
  sessionService: SessionService | null,
  mfaService: MfaService | null,
) {
  const authRouter = Router();
  const requireDb = requireDatabaseConfigured(sessionService);
  const requireMfa = requireDatabaseConfigured(mfaService);

  authRouter.post("/login", requireDb, async (req, res, next) => {
    try {
      if (!sessionService) {
        throw new AppError(
          503,
          "database_unavailable",
          "Database is not configured.",
        );
      }

      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, "invalid_body", "Invalid login payload.");
      }

      const userAgent = req.get("user-agent");
      const ipAddress = req.ip;

      const result = await sessionService.login({
        username: parsed.data.username,
        password: parsed.data.password,
        ...(userAgent ? { userAgent } : {}),
        ...(ipAddress ? { ipAddress } : {}),
      });

      if (result.status === "mfa_required") {
        // Pas de cookie : le mot de passe seul n'ouvre plus de session.
        const body: LoginResponse = {
          status: "mfa_required",
          challengeToken: result.challengeToken,
        };
        res.status(200).json(body);
        return;
      }

      setSessionCookie(res, env, result.token);
      const body: LoginResponse = { status: "ok", user: result.user };
      res.status(200).json(body);
    } catch (error) {
      next(error);
    }
  });

  authRouter.post("/mfa/verify", requireDb, async (req, res, next) => {
    try {
      if (!sessionService) {
        throw new AppError(
          503,
          "database_unavailable",
          "Database is not configured.",
        );
      }

      const parsed = mfaVerifySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, "invalid_body", "Invalid MFA payload.");
      }

      const userAgent = req.get("user-agent");
      const ipAddress = req.ip;

      const result = await sessionService.verifyMfa({
        challengeToken: parsed.data.challengeToken,
        code: parsed.data.code,
        ...(userAgent ? { userAgent } : {}),
        ...(ipAddress ? { ipAddress } : {}),
      });

      setSessionCookie(res, env, result.token);
      const body: AuthResponse = { user: result.user };
      res.status(200).json(body);
    } catch (error) {
      next(error);
    }
  });

  authRouter.post("/logout", requireDb, async (req, res, next) => {
    try {
      if (sessionService && req.sessionId) {
        await sessionService.revokeSession(req.sessionId);
      }

      clearSessionCookie(res, env);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  authRouter.get("/me", requireDb, requireAuth, (req, res) => {
    const body: AuthResponse = { user: req.user! };
    res.status(200).json(body);
  });

  authRouter.get(
    "/mfa",
    requireDb,
    requireAuth,
    requireMfa,
    async (req, res, next) => {
      try {
        const status = await mfaService!.getStatus(req.user!.id);
        const body: MfaStatusResponse = {
          ...status,
          sessionVerified: req.sessionMfaVerified === true,
        };
        res.status(200).json(body);
      } catch (error) {
        next(error);
      }
    },
  );

  authRouter.post(
    "/mfa/setup",
    requireDb,
    requireAuth,
    requireMfa,
    async (req, res, next) => {
      try {
        const parsed = mfaSetupSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new AppError(400, "invalid_body", "Invalid MFA payload.");
        }

        const result = await mfaService!.startSetup(
          req.user!.id,
          parsed.data.password,
        );
        const body: MfaSetupResponse = result;
        res.status(200).json(body);
      } catch (error) {
        next(error);
      }
    },
  );

  authRouter.post(
    "/mfa/enable",
    requireDb,
    requireAuth,
    requireMfa,
    async (req, res, next) => {
      try {
        const parsed = mfaEnableSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new AppError(400, "invalid_body", "Invalid MFA payload.");
        }

        const result = await mfaService!.enable(
          req.user!.id,
          parsed.data.code,
        );

        // L'utilisateur vient de prouver un code valide : la session courante
        // est marquée vérifiée, toutes les autres sessions non vérifiées sont
        // fermées (elles ne reposaient que sur le mot de passe).
        if (sessionService && req.sessionId) {
          await sessionService.markSessionMfaVerified(req.sessionId);
          await sessionService.revokeUnverifiedSessions(
            req.user!.id,
            req.sessionId,
          );
        }

        const body: MfaEnableResponse = result;
        res.status(200).json(body);
      } catch (error) {
        next(error);
      }
    },
  );

  authRouter.post(
    "/mfa/disable",
    requireDb,
    requireAuth,
    requireMfa,
    async (req, res, next) => {
      try {
        const parsed = mfaDisableSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new AppError(400, "invalid_body", "Invalid MFA payload.");
        }

        await mfaService!.disable(req.user!.id, parsed.data.password);
        // Plus de second facteur : plus aucune session ne peut ouvrir le terminal.
        if (sessionService) {
          await sessionService.clearMfaVerification(req.user!.id);
        }
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  );

  authRouter.post(
    "/mfa/backup-codes",
    requireDb,
    requireAuth,
    requireMfa,
    async (req, res, next) => {
      try {
        const parsed = mfaBackupCodesSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new AppError(400, "invalid_body", "Invalid MFA payload.");
        }

        const result = await mfaService!.regenerateBackupCodes(
          req.user!.id,
          parsed.data.code,
        );
        const body: MfaBackupCodesResponse = result;
        res.status(200).json(body);
      } catch (error) {
        next(error);
      }
    },
  );

  authRouter.get("/sessions", requireDb, requireAuth, async (req, res, next) => {
    try {
      if (!sessionService) {
        throw new AppError(
          503,
          "database_unavailable",
          "Database is not configured.",
        );
      }

      const sessions = await sessionService.listSessions(
        req.user!.id,
        req.sessionId ?? "",
      );
      const body: AuthSessionsResponse = { sessions };
      res.status(200).json(body);
    } catch (error) {
      next(error);
    }
  });

  authRouter.post(
    "/sessions/revoke-others",
    requireDb,
    requireAuth,
    async (req, res, next) => {
      try {
        if (!sessionService || !req.sessionId) {
          throw new AppError(
            400,
            "session_required",
            "A session is required for this action.",
          );
        }

        await sessionService.revokeOtherSessions(req.user!.id, req.sessionId);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  );

  authRouter.delete(
    "/sessions/:sessionId",
    requireDb,
    requireAuth,
    async (req, res, next) => {
      try {
        if (!sessionService) {
          throw new AppError(
            503,
            "database_unavailable",
            "Database is not configured.",
          );
        }

        const parsed = z
          .string()
          .uuid()
          .safeParse(req.params.sessionId);
        if (!parsed.success) {
          throw new AppError(400, "invalid_session_id", "Invalid session id.");
        }

        if (parsed.data === req.sessionId) {
          throw new AppError(
            400,
            "current_session",
            "Use logout to end the current session.",
          );
        }

        await sessionService.revokeUserSession(req.user!.id, parsed.data);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  );

  return authRouter;
}
