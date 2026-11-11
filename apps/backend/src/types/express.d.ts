import type { SessionUser } from "@martylab/shared";

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
      sessionId?: string;
      /** La session courante a été ouverte avec un second facteur validé. */
      sessionMfaVerified?: boolean;
    }
  }
}

export {};
