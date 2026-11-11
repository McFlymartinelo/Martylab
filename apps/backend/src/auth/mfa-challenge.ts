import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Jeton de défi MFA.
 *
 * Émis après validation du mot de passe, il prouve que l'étape 1 du login a
 * réussi sans ouvrir de session. Il expire vite, n'est pas un cookie, et ne
 * remplace jamais le second facteur : sans code TOTP valide il ne sert à rien.
 */

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const MAX_TOKEN_LENGTH = 1024;

interface ChallengePayload {
  /** Identifiant utilisateur. */
  u: string;
  /** Expiration (epoch ms). */
  e: number;
  /** Nonce : deux défis émis au même instant restent distincts. */
  n: string;
}

function signature(body: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`martylab-mfa-challenge:${body}`)
    .digest("base64url");
}

export function createMfaChallengeToken(
  userId: string,
  secret: string,
  ttlMs = CHALLENGE_TTL_MS,
): string {
  const payload: ChallengePayload = {
    u: userId,
    e: Date.now() + ttlMs,
    n: randomBytes(12).toString("base64url"),
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${signature(body, secret)}`;
}

export function verifyMfaChallengeToken(
  token: string,
  secret: string,
): { userId: string } | null {
  if (typeof token !== "string" || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    return null;
  }

  const separator = token.lastIndexOf(".");
  if (separator <= 0) {
    return null;
  }

  const body = token.slice(0, separator);
  const provided = token.slice(separator + 1);
  const expected = signature(body, secret);

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  let payload: ChallengePayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as ChallengePayload;
  } catch {
    return null;
  }

  if (
    typeof payload?.u !== "string" ||
    typeof payload?.e !== "number" ||
    !Number.isFinite(payload.e)
  ) {
    return null;
  }

  if (payload.e < Date.now()) {
    return null;
  }

  return { userId: payload.u };
}
