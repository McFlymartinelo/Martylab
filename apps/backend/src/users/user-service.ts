import { and, count, eq, ne } from "drizzle-orm";
import type { User, UserRole } from "@martylab/shared";
import type { Database } from "../db/client.js";
import { sessions, users } from "../db/schema.js";
import { hashPassword } from "../auth/password.js";
import { AppError } from "../lib/errors.js";

function toUser(row: {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}): User {
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    role: row.role,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

async function countAdmins(db: NonNullable<Database>): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(users)
    .where(eq(users.role, "admin"));
  return row?.value ?? 0;
}

export function createUserService(db: NonNullable<Database>) {
  return {
    async listUsers(): Promise<User[]> {
      const rows = await db
        .select()
        .from(users)
        .orderBy(users.username);

      return rows.map(toUser);
    },

    async createUser(input: {
      username: string;
      displayName: string;
      password: string;
      role: UserRole;
    }): Promise<User> {
      const username = normalizeUsername(input.username);
      const displayName = input.displayName.trim();

      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existing[0]) {
        throw new AppError(
          409,
          "username_taken",
          "This username is already taken.",
        );
      }

      const passwordHash = await hashPassword(input.password);
      const [created] = await db
        .insert(users)
        .values({
          username,
          displayName,
          role: input.role,
          passwordHash,
        })
        .returning();

      if (!created) {
        throw new AppError(500, "user_create_failed", "Unable to create user.");
      }

      return toUser(created);
    },

    async updateUser(
      userId: string,
      actorId: string,
      input: {
        displayName?: string;
        password?: string;
        role?: UserRole;
      },
    ): Promise<User> {
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!existing) {
        throw new AppError(404, "user_not_found", "User not found.");
      }

      const nextRole = input.role ?? existing.role;
      const isSelf = userId === actorId;
      const demotingSelfFromAdmin =
        isSelf && existing.role === "admin" && nextRole !== "admin";

      if (demotingSelfFromAdmin) {
        const adminCount = await countAdmins(db);
        if (adminCount <= 1) {
          throw new AppError(
            400,
            "last_admin",
            "Cannot remove the last administrator.",
          );
        }
      }

      if (existing.role === "admin" && nextRole !== "admin") {
        const adminCount = await countAdmins(db);
        if (adminCount <= 1) {
          throw new AppError(
            400,
            "last_admin",
            "Cannot remove the last administrator.",
          );
        }
      }

      const updates: {
        displayName?: string;
        role?: UserRole;
        passwordHash?: string;
      } = {};

      if (input.displayName !== undefined) {
        updates.displayName = input.displayName.trim();
      }

      if (input.role !== undefined) {
        updates.role = input.role;
      }

      if (input.password !== undefined) {
        updates.passwordHash = await hashPassword(input.password);
      }

      if (Object.keys(updates).length === 0) {
        return toUser(existing);
      }

      const [updated] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, userId))
        .returning();

      if (!updated) {
        throw new AppError(500, "user_update_failed", "Unable to update user.");
      }

      return toUser(updated);
    },

    async deleteUser(userId: string, actorId: string): Promise<void> {
      if (userId === actorId) {
        throw new AppError(
          400,
          "cannot_delete_self",
          "You cannot delete your own account.",
        );
      }

      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!existing) {
        throw new AppError(404, "user_not_found", "User not found.");
      }

      if (existing.role === "admin") {
        const [otherAdmin] = await db
          .select({ id: users.id })
          .from(users)
          .where(and(eq(users.role, "admin"), ne(users.id, userId)))
          .limit(1);

        if (!otherAdmin) {
          throw new AppError(
            400,
            "last_admin",
            "Cannot delete the last administrator.",
          );
        }
      }

      await db.delete(sessions).where(eq(sessions.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
    },
  };
}

export type UserService = ReturnType<typeof createUserService>;
