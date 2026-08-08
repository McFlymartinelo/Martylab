import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@martylab/shared";
import type { Env } from "../config/env.js";
import type { SessionService } from "../auth/session-service.js";
import { AppError } from "../lib/errors.js";

export function createSessionMiddleware(
  env: Env,
  sessionService: SessionService | null,
) {
  return async function sessionMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!sessionService) {
        next();
        return;
      }

      const token = req.cookies?.[env.SESSION_COOKIE_NAME] as string | undefined;
      const resolved = await sessionService.resolveSession(token);

      if (resolved) {
        req.user = resolved.user;
        req.sessionId = resolved.sessionId;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    next(new AppError(401, "unauthenticated", "Authentication required."));
    return;
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return function roleMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction,
  ): void {
    if (!req.user) {
      next(new AppError(401, "unauthenticated", "Authentication required."));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError(403, "forbidden", "Insufficient permissions."));
      return;
    }

    next();
  };
}

export function requireDatabaseConfigured(
  sessionService: SessionService | null,
) {
  return function databaseMiddleware(
    _req: Request,
    _res: Response,
    next: NextFunction,
  ): void {
    if (!sessionService) {
      next(
        new AppError(
          503,
          "database_unavailable",
          "Database is not configured.",
        ),
      );
      return;
    }
    next();
  };
}

export function createOriginGuard(env: Env) {
  return function originGuard(
    req: Request,
    _res: Response,
    next: NextFunction,
  ): void {
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
      next();
      return;
    }

    const origin = req.get("origin");
    if (!origin) {
      // Non-browser clients may omit Origin; allow for now.
      next();
      return;
    }

    if (origin !== env.CORS_ORIGIN) {
      next(new AppError(403, "origin_forbidden", "Origin is not allowed."));
      return;
    }

    next();
  };
}
