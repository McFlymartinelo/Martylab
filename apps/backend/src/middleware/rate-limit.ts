import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";

/**
 * Normalises the client IP into a rate-limit key.
 *
 * `ipKeyGenerator` groups IPv6 addresses by subnet (/64 by default), so a
 * client cannot bypass a limit by rotating addresses within its prefix.
 * Cloudflare Tunnel forwards via X-Forwarded-For, already trusted through
 * `trust proxy 1` in app.ts.
 */
function clientKey(req: Request): string {
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  return ipKeyGenerator(ip);
}

/**
 * Rate limiter tuned for the auth login endpoint (brute-force protection).
 * Mounted on `/api/auth/login` only: session reads (/me) and logout must not
 * be throttled by credential-guessing protection.
 */
export function createAuthRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: clientKey,
    message: {
      error: {
        code: "too_many_requests",
        message: "Too many attempts, try again later.",
      },
    },
  });
}

/**
 * Light global limiter to protect the backend from abuse.
 */
export function createGlobalRateLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: clientKey,
    skip: (req) => req.path === "/api/health" || req.path === "/api/health/live",
    message: {
      error: {
        code: "too_many_requests",
        message: "Too many requests, slow down.",
      },
    },
  });
}
