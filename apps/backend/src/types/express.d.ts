import type { SessionUser } from "@martylab/shared";

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
      sessionId?: string;
    }
  }
}

export {};
