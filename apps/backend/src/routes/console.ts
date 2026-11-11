import { Router } from "express";
import { z } from "zod";
import type {
  ConsoleAuditResponse,
  ConsoleCommandsResponse,
  ConsoleExecuteResponse,
} from "@martylab/shared";
import type { ConsoleService } from "../console/console-service.js";
import { AppError } from "../lib/errors.js";
import {
  requireAuth,
  requireDatabaseConfigured,
  requireRole,
} from "../middleware/auth.js";

const executeSchema = z.object({
  input: z.string().min(1).max(200),
  confirm: z.boolean().optional(),
});

const auditQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export function createConsoleRouter(consoleService: ConsoleService | null) {
  const consoleRouter = Router();
  const requireConsole = requireDatabaseConfigured(consoleService);

  consoleRouter.get(
    "/commands",
    requireAuth,
    requireRole("admin"),
    requireConsole,
    (_req, res) => {
      const body: ConsoleCommandsResponse = {
        commands: consoleService!.listCommands(),
        terminalEnabled: consoleService!.isTerminalEnabled(),
      };
      res.status(200).json(body);
    },
  );

  consoleRouter.post(
    "/execute",
    requireAuth,
    requireRole("admin"),
    requireConsole,
    async (req, res, next) => {
      try {
        const parsed = executeSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new AppError(400, "invalid_body", "Invalid console payload.");
        }

        const result = await consoleService!.execute(
          req.user!,
          parsed.data.input,
          parsed.data.confirm ?? false,
        );
        const body: ConsoleExecuteResponse = result;
        res.status(200).json(body);
      } catch (error) {
        next(error);
      }
    },
  );

  consoleRouter.get(
    "/audit",
    requireAuth,
    requireRole("admin"),
    requireConsole,
    async (req, res, next) => {
      try {
        const parsed = auditQuerySchema.safeParse(req.query);
        if (!parsed.success) {
          throw new AppError(400, "invalid_query", "Invalid audit query.");
        }

        const entries = await consoleService!.listAudit(parsed.data.limit);
        const body: ConsoleAuditResponse = { entries };
        res.status(200).json(body);
      } catch (error) {
        next(error);
      }
    },
  );

  return consoleRouter;
}
