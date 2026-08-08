import type { CookieOptions, Response } from "express";
import type { Env } from "../config/env.js";

export function sessionCookieOptions(env: Env): CookieOptions {
  const maxAgeMs = env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

  return {
    httpOnly: true,
    secure: Boolean(env.COOKIE_SECURE),
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeMs,
  };
}

export function setSessionCookie(
  res: Response,
  env: Env,
  token: string,
): void {
  res.cookie(env.SESSION_COOKIE_NAME, token, sessionCookieOptions(env));
}

export function clearSessionCookie(res: Response, env: Env): void {
  res.clearCookie(env.SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: Boolean(env.COOKIE_SECURE),
    sameSite: "lax",
    path: "/",
  });
}
