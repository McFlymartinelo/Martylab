import { createHash, randomBytes } from "node:crypto";

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string, sessionSecret: string): string {
  return createHash("sha256")
    .update(`${sessionSecret}:${token}`)
    .digest("hex");
}
