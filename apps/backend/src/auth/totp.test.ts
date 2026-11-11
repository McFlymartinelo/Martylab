import { describe, expect, it } from "vitest";
import {
  backupCodeMatches,
  buildOtpauthUri,
  createBackupCodes,
  decodeBase32,
  decryptTotpSecret,
  encryptTotpSecret,
  encodeBase32,
  generateTotp,
  hashBackupCode,
  normalizeBackupCode,
  verifyTotp,
} from "./totp.js";
import {
  createMfaChallengeToken,
  verifyMfaChallengeToken,
} from "./mfa-challenge.js";

/** "12345678901234567890" encodé en base32, secret des vecteurs RFC 6238. */
const RFC_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
const SESSION_SECRET = "dev-only-martylab-session-secret-change-me";

describe("totp", () => {
  it("reproduit les vecteurs de test SHA-1 de la RFC 6238", () => {
    // La RFC publie 8 chiffres ; on tronque aux 6 derniers.
    const vectors: Array<[number, string]> = [
      [59, "287082"],
      [1_111_111_109, "081804"],
      [1_111_111_111, "050471"],
      [1_234_567_890, "005924"],
      [2_000_000_000, "279037"],
      [20_000_000_000, "353130"],
    ];

    for (const [seconds, expected] of vectors) {
      expect(generateTotp(RFC_SECRET, seconds * 1000)).toBe(expected);
      expect(verifyTotp(RFC_SECRET, expected, seconds * 1000)).toBe(true);
    }
  });

  it("tolère un pas de décalage d'horloge, pas deux", () => {
    const at = 60_000;
    const token = generateTotp(RFC_SECRET, at);

    expect(verifyTotp(RFC_SECRET, token, at + 29_000)).toBe(true);
    expect(verifyTotp(RFC_SECRET, token, at + 90_000)).toBe(false);
  });

  it("rejette un code mal formé sans lever d'exception", () => {
    expect(verifyTotp(RFC_SECRET, "abc")).toBe(false);
    expect(verifyTotp(RFC_SECRET, "12345")).toBe(false);
    expect(verifyTotp("pas-du-base32!", "123456")).toBe(false);
  });

  it("encode et décode le base32 sans perte", () => {
    const bytes = Buffer.from([
      0x00, 0xff, 0x10, 0x42, 0x7f, 0x80, 0x01, 0x99, 0xab, 0xcd,
    ]);
    expect(decodeBase32(encodeBase32(bytes))).toEqual(bytes);
    expect(() => decodeBase32("AAAA1AAA")).toThrow();
  });

  it("construit une URI otpauth exploitable", () => {
    const uri = buildOtpauthUri({
      secret: RFC_SECRET,
      accountName: "alexandre",
      issuer: "Martylab",
    });

    expect(uri.startsWith("otpauth://totp/Martylab:alexandre?")).toBe(true);
    expect(uri).toContain(`secret=${RFC_SECRET}`);
    expect(uri).toContain("digits=6");
    expect(uri).toContain("period=30");
  });

  it("chiffre les secrets et détecte une altération", () => {
    const encrypted = encryptTotpSecret(RFC_SECRET, SESSION_SECRET);

    expect(encrypted).not.toContain(RFC_SECRET);
    expect(decryptTotpSecret(encrypted, SESSION_SECRET)).toBe(RFC_SECRET);

    // Mauvaise clé (SESSION_SECRET changé) : illisible, pas d'exception.
    expect(decryptTotpSecret(encrypted, `${SESSION_SECRET}x`)).toBeNull();

    const parts = encrypted.split(".");
    parts[3] = `${parts[3]}AA`;
    expect(decryptTotpSecret(parts.join("."), SESSION_SECRET)).toBeNull();
  });

  it("génère des codes de secours uniques et vérifiables", () => {
    const codes = createBackupCodes(10);

    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    for (const code of codes) {
      expect(code).toMatch(/^[A-Z2-9]{5}-[A-Z2-9]{5}$/);
      expect(normalizeBackupCode(code)).toHaveLength(10);
      const hash = hashBackupCode(code, SESSION_SECRET);
      expect(backupCodeMatches(code, hash, SESSION_SECRET)).toBe(true);
      expect(backupCodeMatches(`${code}X`, hash, SESSION_SECRET)).toBe(false);
    }
  });

  it("accepte un code de secours recopié sans tiret ni casse", () => {
    const [code] = createBackupCodes(1);
    const hash = hashBackupCode(code!, SESSION_SECRET);
    const typed = code!.replace("-", "").toLowerCase();

    expect(backupCodeMatches(typed, hash, SESSION_SECRET)).toBe(true);
  });
});

describe("mfa challenge token", () => {
  it("signe et vérifie un défi", () => {
    const token = createMfaChallengeToken("user-1", SESSION_SECRET);
    expect(verifyMfaChallengeToken(token, SESSION_SECRET)).toEqual({
      userId: "user-1",
    });
  });

  it("refuse un défi expiré", () => {
    const token = createMfaChallengeToken("user-1", SESSION_SECRET, -1_000);
    expect(verifyMfaChallengeToken(token, SESSION_SECRET)).toBeNull();
  });

  it("refuse une signature altérée ou une autre clé", () => {
    const token = createMfaChallengeToken("user-1", SESSION_SECRET);
    const [body] = token.split(".");

    expect(
      verifyMfaChallengeToken(`${body}.AAAA`, SESSION_SECRET),
    ).toBeNull();
    expect(verifyMfaChallengeToken(token, `${SESSION_SECRET}x`)).toBeNull();
    expect(verifyMfaChallengeToken("", SESSION_SECRET)).toBeNull();
    expect(verifyMfaChallengeToken("nodot", SESSION_SECRET)).toBeNull();
  });
});
