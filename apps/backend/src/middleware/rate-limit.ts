import rateLimit from "express-rate-limit";
import type { Request } from "express";

/**
 * Rate limiter tuned for the auth endpoints (brute-force protection).
 * Keyed on the client IP (Cloudflare Tunnel forwards via X-Forwarded-For,
 * already trusted via `trust proxy 1` in app.ts).
 */
export function createAuthRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => req.ip ?? req.socket.remoteAddress ?? "unknown",
    message: { error: "too_many_requests", message: "Too many attempts, try again later." },
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
    keyGenerator: (req: Request) => req.ip ?? req.socket.remoteAddress ?? "unknown",
    skip: (req) => req.path === "/api/health" || req.path === "/api/health/live",
    message: { error: "too_many_requests", message: "Too many requests, slow down." },
  });
}