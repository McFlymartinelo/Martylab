import { Router } from "express";
import { z } from "zod";
import type { UsersResponse } from "@martylab/shared";
import type { UserService } from "../users/user-service.js";
import { AppError } from "../lib/errors.js";
import {
  requireAuth,
  requireDatabaseConfigured,
  requireRole,
} from "../middleware/auth.js";

const userRoleSchema = z.enum(["admin", "user", "guest"]);

const usernameSchema = z
  .string()
  .trim()
  .min(2)
  .max(64)
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Username may only contain letters, numbers, underscores, and hyphens.",
  );

const createUserSchema = z.object({
  username: usernameSchema,
  displayName: z.string().trim().min(1).max(120),
  password: z.string().min(8).max(200),
  role: userRoleSchema,
});

const updateUserSchema = z
  .object({
    displayName: z.string().trim().min(1).max(120).optional(),
    password: z.string().min(8).max(200).optional(),
    role: userRoleSchema.optional(),
  })
  .refine(
    (value) =>
      value.displayName !== undefined ||
      value.password !== undefined ||
      value.role !== undefined,
    { message: "At least one field must be provided." },
  );

export function createUsersRouter(userService: UserService | null) {
  const usersRouter = Router();
  const requireDb = requireDatabaseConfigured(userService);
  const requireAdmin = requireRole("admin");

  usersRouter.get(
    "/",
    requireDb,
    requireAuth,
    requireAdmin,
    async (_req, res, next) => {
      try {
        if (!userService) {
          throw new AppError(
            503,
            "database_unavailable",
            "Database is not configured.",
          );
        }

        const users = await userService.listUsers();
        const body: UsersResponse = { users };
        res.status(200).json(body);
      } catch (error) {
        next(error);
      }
    },
  );

  usersRouter.post(
    "/",
    requireDb,
    requireAuth,
    requireAdmin,
    async (req, res, next) => {
      try {
        if (!userService) {
          throw new AppError(
            503,
            "database_unavailable",
            "Database is not configured.",
          );
        }

        const parsed = createUserSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new AppError(400, "invalid_body", "Invalid user payload.");
        }

        const user = await userService.createUser(parsed.data);
        res.status(201).json({ user });
      } catch (error) {
        next(error);
      }
    },
  );

  usersRouter.patch(
    "/:userId",
    requireDb,
    requireAuth,
    requireAdmin,
    async (req, res, next) => {
      try {
        if (!userService) {
          throw new AppError(
            503,
            "database_unavailable",
            "Database is not configured.",
          );
        }

        const parsed = updateUserSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new AppError(400, "invalid_body", "Invalid user payload.");
        }

        const userId = req.params.userId;
        if (typeof userId !== "string") {
          throw new AppError(400, "invalid_user_id", "Invalid user id.");
        }

        const updates: {
          displayName?: string;
          password?: string;
          role?: "admin" | "user" | "guest";
        } = {};

        if (parsed.data.displayName !== undefined) {
          updates.displayName = parsed.data.displayName;
        }
        if (parsed.data.password !== undefined) {
          updates.password = parsed.data.password;
        }
        if (parsed.data.role !== undefined) {
          updates.role = parsed.data.role;
        }

        const user = await userService.updateUser(
          userId,
          req.user!.id,
          updates,
        );
        res.status(200).json({ user });
      } catch (error) {
        next(error);
      }
    },
  );

  usersRouter.delete(
    "/:userId",
    requireDb,
    requireAuth,
    requireAdmin,
    async (req, res, next) => {
      try {
        if (!userService) {
          throw new AppError(
            503,
            "database_unavailable",
            "Database is not configured.",
          );
        }

        const userId = req.params.userId;
        if (typeof userId !== "string") {
          throw new AppError(400, "invalid_user_id", "Invalid user id.");
        }

        await userService.deleteUser(userId, req.user!.id);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  );

  return usersRouter;
}
