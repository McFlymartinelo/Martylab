import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  hkdfSync,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";

/**
 * TOTP (RFC 6238) et primitives associées.
 *
 * Pas de dépendance externe : HMAC-SHA1 et AES-256-GCM sont fournis par Node.
 * La génération de codes est couverte par les vecteurs de test de la RFC 6238,
 * ce qui protège contre les erreurs classiques (base32, troncature dynamique,
 * décalage de compteur).
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const TOTP_DIGITS = 6;
export const TOTP_PERIOD_SECONDS = 30;
/** Tolérance d'horloge : ±1 pas, soit ±30 secondes. */
const TOTP_WINDOW = 1;

/** Alphabet sans caractères ambigus (0/O, 1/I/L) pour les codes de secours. */
const BACKUP_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const BACKUP_CODE_LENGTH = 10;
export const BACKUP_CODE_COUNT = 10;

export function encodeBase32(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export function decodeBase32(input: string): Buffer {
  const normalized = input.replace(/[\s=-]/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error("Invalid base32 character.");
    }
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

/** Secret base32 de 160 bits, taille recommandée par la RFC 4226. */
export function generateTotpSecret(bytes = 20): string {
  return encodeBase32(randomBytes(bytes));
}

function hotp(secret: Buffer, counter: number): string {
  const message = Buffer.alloc(8);
  message.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  message.writeUInt32BE(counter >>> 0, 4);

  const digest = createHmac("sha1", secret).update(message).digest();
  const offset = (digest[digest.length - 1] ?? 0) & 0x0f;
  // Le bit de poids fort est masqué : la valeur reste un entier 31 bits positif.
  const binary =
    ((digest[offset] ?? 0) & 0x7f) * 2 ** 24 +
    ((digest[offset + 1] ?? 0) & 0xff) * 2 ** 16 +
    ((digest[offset + 2] ?? 0) & 0xff) * 2 ** 8 +
    ((digest[offset + 3] ?? 0) & 0xff);

  return (binary % 10 ** TOTP_DIGITS).toString().padStart(TOTP_DIGITS, "0");
}

function counterAt(atMs: number): number {
  return Math.floor(atMs / 1000 / TOTP_PERIOD_SECONDS);
}

export function generateTotp(secret: string, atMs = Date.now()): string {
  return hotp(decodeBase32(secret), counterAt(atMs));
}

export function normalizeTotpToken(input: string): string {
  return input.replace(/[^0-9]/g, "");
}

export function verifyTotp(
  secret: string,
  token: string,
  atMs = Date.now(),
): boolean {
  const normalized = normalizeTotpToken(token);
  if (normalized.length !== TOTP_DIGITS) {
    return false;
  }

  let secretBuffer: Buffer;
  try {
    secretBuffer = decodeBase32(secret);
  } catch {
    return false;
  }

  const expected = Buffer.from(normalized);
  const counter = counterAt(atMs);

  let valid = false;
  for (let offset = -TOTP_WINDOW; offset <= TOTP_WINDOW; offset += 1) {
    const candidate = hotp(secretBuffer, counter + offset);
    // Comparaison en temps constant : on ne sort pas de la boucle.
    if (timingSafeEqual(Buffer.from(candidate), expected)) {
      valid = true;
    }
  }

  return valid;
}

export function buildOtpauthUri(options: {
  secret: string;
  accountName: string;
  issuer?: string;
}): string {
  const issuer = options.issuer ?? "Martylab";
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(options.accountName)}`;
  const params = new URLSearchParams({
    secret: options.secret,
    issuer,
    algorithm: "SHA1",
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/**
 * Clé de chiffrement des secrets TOTP, dérivée du secret de session.
 *
 * Conséquence assumée et documentée : changer `SESSION_SECRET` invalide les
 * secrets TOTP existants (toutes les sessions tombent de toute façon).
 */
function deriveMfaKey(sessionSecret: string): Buffer {
  return Buffer.from(
    hkdfSync("sha256", sessionSecret, "martylab-mfa", "totp-secret-v1", 32),
  );
}

/** Chiffre un secret TOTP en AES-256-GCM : `v1.<iv>.<tag>.<data>`. */
export function encryptTotpSecret(plain: string, sessionSecret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveMfaKey(sessionSecret), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptTotpSecret(
  payload: string,
  sessionSecret: string,
): string | null {
  const [version, iv, tag, data] = payload.split(".");
  if (version !== "v1" || !iv || !tag || !data) {
    return null;
  }

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      deriveMfaKey(sessionSecret),
      Buffer.from(iv, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(data, "base64url")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

export function normalizeBackupCode(code: string): string {
  return code.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

/** Codes de secours à usage unique, format `XXXXX-XXXXX`. */
export function createBackupCodes(count = BACKUP_CODE_COUNT): string[] {
  const codes = new Set<string>();

  while (codes.size < count) {
    let raw = "";
    for (let index = 0; index < BACKUP_CODE_LENGTH; index += 1) {
      raw += BACKUP_CODE_ALPHABET[randomInt(BACKUP_CODE_ALPHABET.length)];
    }
    codes.add(`${raw.slice(0, 5)}-${raw.slice(5)}`);
  }

  return [...codes];
}

/**
 * Les codes de secours ont ~50 bits d'entropie et sont déjà à usage unique :
 * un HMAC clé par le secret serveur suffit (pas besoin d'Argon2, trop lent
 * pour 10 comparaisons à chaque tentative).
 */
export function hashBackupCode(code: string, sessionSecret: string): string {
  return createHmac("sha256", sessionSecret)
    .update(`martylab-backup-code:${normalizeBackupCode(code)}`)
    .digest("hex");
}

export function backupCodeMatches(
  code: string,
  hash: string,
  sessionSecret: string,
): boolean {
  const candidate = Buffer.from(hashBackupCode(code, sessionSecret));
  const expected = Buffer.from(hash);
  return (
    candidate.length === expected.length && timingSafeEqual(candidate, expected)
  );
}
