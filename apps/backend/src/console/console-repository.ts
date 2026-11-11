import { desc } from "drizzle-orm";
import type {
  ConsoleAuditEntry,
  ConsoleAuditStatus,
  ConsoleRisk,
} from "@martylab/shared";
import type { Database } from "../db/client.js";
import { consoleAudit } from "../db/schema.js";

export interface ConsoleAuditInput {
  userId: string | null;
  username: string;
  command: string;
  status: ConsoleAuditStatus;
  risk: ConsoleRisk | string;
  outputPreview?: string | null;
  durationMs?: number | null;
}

const PREVIEW_LIMIT = 500;

export function createConsoleRepository(db: NonNullable<Database>) {
  return {
    async record(input: ConsoleAuditInput): Promise<void> {
      const preview = input.outputPreview
        ? input.outputPreview.slice(0, PREVIEW_LIMIT)
        : null;

      await db.insert(consoleAudit).values({
        userId: input.userId,
        username: input.username,
        command: input.command,
        status: input.status,
        risk: input.risk,
        outputPreview: preview,
        durationMs: input.durationMs ?? null,
      });
    },

    async list(limit = 40): Promise<ConsoleAuditEntry[]> {
      const rows = await db
        .select()
        .from(consoleAudit)
        .orderBy(desc(consoleAudit.createdAt))
        .limit(Math.min(Math.max(limit, 1), 200));

      return rows.map((row) => ({
        id: row.id,
        username: row.username,
        command: row.command,
        status: row.status as ConsoleAuditStatus,
        risk: row.risk,
        outputPreview: row.outputPreview,
        createdAt: row.createdAt.toISOString(),
      }));
    },
  };
}

export type ConsoleRepository = ReturnType<typeof createConsoleRepository>;
