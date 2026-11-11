import { Router } from "express";
import { z } from "zod";
import type {
  AuthResponse,
  AuthSessionsResponse,
} from "@martylab/shared";
import type { Env } from "../config/env.js";
import type { SessionService } from "../auth/session-service.js";
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

export function createAuthRouter(env: Env, sessionService: SessionService | null) {
  const authRouter = Router();
  const requireDb = requireDatabaseConfigured(sessionService);

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
