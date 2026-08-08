import { and, desc, eq, gt } from "drizzle-orm";
import type {
  AssistantActionLogEntry,
  AssistantConversation,
  AssistantMessage,
  AssistantMessageMetadata,
  AssistantMessageRole,
} from "@martylab/shared";
import type { Database } from "../db/client.js";
import {
  assistantActionLogs,
  assistantConversations,
  assistantMessages,
  assistantPendingConfirmations,
} from "../db/schema.js";
import { AppError } from "../lib/errors.js";

function parseMetadata(raw: string | null): AssistantMessageMetadata | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AssistantMessageMetadata;
  } catch {
    return null;
  }
}

function toConversation(row: {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}): AssistantConversation {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toMessage(row: {
  id: string;
  conversationId: string;
  role: AssistantMessageRole;
  content: string;
  metadataJson: string | null;
  createdAt: Date;
}): AssistantMessage {
  return {
    id: row.id,
    conversationId: row.conversationId,
    role: row.role,
    content: row.content,
    metadata: parseMetadata(row.metadataJson),
    createdAt: row.createdAt.toISOString(),
  };
}

export function createAssistantRepository(db: NonNullable<Database>) {
  return {
    async listConversations(userId: string): Promise<AssistantConversation[]> {
      const rows = await db
        .select()
        .from(assistantConversations)
        .where(eq(assistantConversations.userId, userId))
        .orderBy(desc(assistantConversations.updatedAt));

      return rows.map(toConversation);
    },

    async createConversation(userId: string): Promise<AssistantConversation> {
      const [row] = await db
        .insert(assistantConversations)
        .values({ userId })
        .returning();

      if (!row) {
        throw new AppError(500, "assistant_error", "Unable to create conversation.");
      }

      return toConversation(row);
    },

    async getConversationForUser(
      conversationId: string,
      userId: string,
    ): Promise<AssistantConversation | null> {
      const [row] = await db
        .select()
        .from(assistantConversations)
        .where(
          and(
            eq(assistantConversations.id, conversationId),
            eq(assistantConversations.userId, userId),
          ),
        )
        .limit(1);

      return row ? toConversation(row) : null;
    },

    async deleteConversation(conversationId: string, userId: string): Promise<void> {
      const deleted = await db
        .delete(assistantConversations)
        .where(
          and(
            eq(assistantConversations.id, conversationId),
            eq(assistantConversations.userId, userId),
          ),
        )
        .returning({ id: assistantConversations.id });

      if (deleted.length === 0) {
        throw new AppError(404, "conversation_not_found", "Conversation not found.");
      }
    },

    async listMessages(conversationId: string): Promise<AssistantMessage[]> {
      const rows = await db
        .select()
        .from(assistantMessages)
        .where(eq(assistantMessages.conversationId, conversationId))
        .orderBy(assistantMessages.createdAt);

      return rows.map(toMessage);
    },

    async insertMessage(input: {
      conversationId: string;
      role: AssistantMessageRole;
      content: string;
      metadata?: AssistantMessageMetadata | null;
    }): Promise<AssistantMessage> {
      const [row] = await db
        .insert(assistantMessages)
        .values({
          conversationId: input.conversationId,
          role: input.role,
          content: input.content,
          metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
        })
        .returning();

      if (!row) {
        throw new AppError(500, "assistant_error", "Unable to save message.");
      }

      await db
        .update(assistantConversations)
        .set({ updatedAt: new Date() })
        .where(eq(assistantConversations.id, input.conversationId));

      return toMessage(row);
    },

    async updateConversationTitle(
      conversationId: string,
      title: string,
    ): Promise<void> {
      await db
        .update(assistantConversations)
        .set({ title })
        .where(eq(assistantConversations.id, conversationId));
    },

    async createPendingConfirmation(input: {
      userId: string;
      conversationId: string;
      toolId: string;
      parameters: Record<string, unknown>;
      expiresAt: Date;
    }): Promise<string> {
      const [row] = await db
        .insert(assistantPendingConfirmations)
        .values({
          userId: input.userId,
          conversationId: input.conversationId,
          toolId: input.toolId,
          parametersJson: JSON.stringify(input.parameters),
          expiresAt: input.expiresAt,
        })
        .returning({ id: assistantPendingConfirmations.id });

      if (!row) {
        throw new AppError(500, "assistant_error", "Unable to create confirmation.");
      }

      return row.id;
    },

    async getPendingConfirmation(
      confirmationId: string,
      userId: string,
    ) {
      const [row] = await db
        .select()
        .from(assistantPendingConfirmations)
        .where(
          and(
            eq(assistantPendingConfirmations.id, confirmationId),
            eq(assistantPendingConfirmations.userId, userId),
            gt(assistantPendingConfirmations.expiresAt, new Date()),
          ),
        )
        .limit(1);

      if (!row) {
        return null;
      }

      return {
        id: row.id,
        conversationId: row.conversationId,
        toolId: row.toolId,
        parameters: JSON.parse(row.parametersJson) as Record<string, unknown>,
      };
    },

    async deletePendingConfirmation(confirmationId: string): Promise<void> {
      await db
        .delete(assistantPendingConfirmations)
        .where(eq(assistantPendingConfirmations.id, confirmationId));
    },

    async insertActionLog(input: {
      userId: string;
      conversationId: string | null;
      toolId: string;
      risk: string;
      status: string;
      input: Record<string, unknown> | null;
      output: Record<string, unknown> | null;
    }): Promise<void> {
      await db.insert(assistantActionLogs).values({
        userId: input.userId,
        conversationId: input.conversationId,
        toolId: input.toolId,
        risk: input.risk,
        status: input.status,
        inputJson: input.input ? JSON.stringify(input.input) : null,
        outputJson: input.output ? JSON.stringify(input.output) : null,
      });
    },

    async listActionLogs(userId: string): Promise<AssistantActionLogEntry[]> {
      const rows = await db
        .select()
        .from(assistantActionLogs)
        .where(eq(assistantActionLogs.userId, userId))
        .orderBy(desc(assistantActionLogs.createdAt))
        .limit(50);

      return rows.map((row) => ({
        id: row.id,
        toolId: row.toolId,
        risk: row.risk as AssistantActionLogEntry["risk"],
        status: row.status as AssistantActionLogEntry["status"],
        input: row.inputJson
          ? (JSON.parse(row.inputJson) as Record<string, unknown>)
          : null,
        output: row.outputJson
          ? (JSON.parse(row.outputJson) as Record<string, unknown>)
          : null,
        createdAt: row.createdAt.toISOString(),
      }));
    },
  };
}

export type AssistantRepository = ReturnType<typeof createAssistantRepository>;
