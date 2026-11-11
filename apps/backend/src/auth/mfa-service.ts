import { and, eq, isNull } from "drizzle-orm";
import QRCode from "qrcode";
import type { MfaStatusResponse } from "@martylab/shared";
import type { Database } from "../db/client.js";
import { userBackupCodes, users } from "../db/schema.js";
import { AppError } from "../lib/errors.js";
import { verifyPassword } from "./password.js";
import {
  BACKUP_CODE_COUNT,
  buildOtpauthUri,
  createBackupCodes,
  decryptTotpSecret,
  encryptTotpSecret,
  generateTotpSecret,
  hashBackupCode,
  verifyTotp,
} from "./totp.js";

/**
 * Gestion de l'authentification à deux facteurs (TOTP).
 *
 * Toutes les opérations sensibles (enrôlement, désactivation, régénération
 * des codes de secours) exigent le mot de passe ou un code TOTP valide : un
 * cookie de session volé ne suffit jamais à prendre le contrôle du 2FA.
 */

interface MfaServiceDeps {
  db: NonNullable<Database>;
  sessionSecret: string;
}

export function createMfaService({ db, sessionSecret }: MfaServiceDeps) {
  async function loadUser(userId: string) {
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        passwordHash: users.passwordHash,
        totpSecret: users.totpSecret,
        totpEnabledAt: users.totpEnabledAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new AppError(404, "user_not_found", "Utilisateur introuvable.");
    }

    return user;
  }

  async function requirePassword(
    user: { passwordHash: string },
    password: string,
  ) {
    const valid = await verifyPassword(user.passwordHash, password);
    if (!valid) {
      throw new AppError(401, "invalid_credentials", "Mot de passe incorrect.");
    }
  }

  async function replaceBackupCodes(userId: string): Promise<string[]> {
    await db
      .delete(userBackupCodes)
      .where(eq(userBackupCodes.userId, userId));

    const codes = createBackupCodes(BACKUP_CODE_COUNT);
    await db.insert(userBackupCodes).values(
      codes.map((code) => ({
        userId,
        codeHash: hashBackupCode(code, sessionSecret),
      })),
    );

    return codes;
  }

  return {
    async getStatus(
      userId: string,
    ): Promise<Omit<MfaStatusResponse, "sessionVerified">> {
      const user = await loadUser(userId);

      const remaining = await db
        .select({ id: userBackupCodes.id })
        .from(userBackupCodes)
        .where(
          and(
            eq(userBackupCodes.userId, userId),
            isNull(userBackupCodes.usedAt),
          ),
        );

      return {
        enabled: user.totpEnabledAt !== null,
        backupCodesRemaining: remaining.length,
      };
    },

    /** Génère un secret en attente et renvoie le QR code à scanner. */
    async startSetup(userId: string, password: string) {
      const user = await loadUser(userId);
      await requirePassword(user, password);

      if (user.totpEnabledAt) {
        throw new AppError(
          409,
          "mfa_already_enabled",
          "L'authentification à deux facteurs est déjà active. Désactive-la d'abord.",
        );
      }

      const secret = generateTotpSecret();
      await db
        .update(users)
        .set({
          totpSecret: encryptTotpSecret(secret, sessionSecret),
          totpEnabledAt: null,
        })
        .where(eq(users.id, userId));

      const otpauthUri = buildOtpauthUri({
        secret,
        accountName: user.username,
        issuer: "Martylab",
      });

      const qrDataUrl = await QRCode.toDataURL(otpauthUri, {
        margin: 1,
        width: 220,
        errorCorrectionLevel: "M",
      });

      return { secret, otpauthUri, qrDataUrl };
    },

    /** Confirme le premier code, active le 2FA et émet les codes de secours. */
    async enable(userId: string, code: string) {
      const user = await loadUser(userId);

      if (user.totpEnabledAt) {
        throw new AppError(
          409,
          "mfa_already_enabled",
          "L'authentification à deux facteurs est déjà active.",
        );
      }
      if (!user.totpSecret) {
        throw new AppError(
          400,
          "mfa_setup_missing",
          "Aucun enrôlement en cours. Recommence l'installation.",
        );
      }

      const secret = decryptTotpSecret(user.totpSecret, sessionSecret);
      if (!secret || !verifyTotp(secret, code)) {
        throw new AppError(400, "invalid_mfa_code", "Code invalide.");
      }

      await db
        .update(users)
        .set({ totpEnabledAt: new Date() })
        .where(eq(users.id, userId));

      const backupCodes = await replaceBackupCodes(userId);
      return { backupCodes };
    },

    /** Désactive le 2FA. Exige le mot de passe : action destructrice. */
    async disable(userId: string, password: string) {
      const user = await loadUser(userId);
      await requirePassword(user, password);

      await db
        .update(users)
        .set({ totpSecret: null, totpEnabledAt: null })
        .where(eq(users.id, userId));
      await db
        .delete(userBackupCodes)
        .where(eq(userBackupCodes.userId, userId));
    },

    /** Régénère les codes de secours après vérification d'un code TOTP. */
    async regenerateBackupCodes(userId: string, code: string) {
      const user = await loadUser(userId);

      if (!user.totpEnabledAt || !user.totpSecret) {
        throw new AppError(
          409,
          "mfa_not_enabled",
          "Active d'abord l'authentification à deux facteurs.",
        );
      }

      const secret = decryptTotpSecret(user.totpSecret, sessionSecret);
      if (!secret || !verifyTotp(secret, code)) {
        throw new AppError(400, "invalid_mfa_code", "Code invalide.");
      }

      const backupCodes = await replaceBackupCodes(userId);
      return { backupCodes };
    },
  };
}

export type MfaService = ReturnType<typeof createMfaService>;
