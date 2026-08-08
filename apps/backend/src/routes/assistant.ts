import { Router } from "express";
import { z } from "zod";
import type {
  AssistantActionLogsResponse,
  AssistantConfirmationResponse,
  AssistantConversationDetail,
  AssistantConversationsResponse,
  AssistantSendMessageResponse,
  AssistantToolsResponse,
} from "@martylab/shared";
import type { AssistantService } from "../assistant/assistant-service.js";
import { AppError } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";

const sendMessageSchema = z.object({
  content: z.string().trim().min(1).max(4000),
});

function parseConversationId(raw: string | string[] | undefined): string {
  if (typeof raw !== "string" || raw.length === 0) {
    throw new AppError(400, "invalid_conversation_id", "Invalid conversation id.");
  }

  return raw;
}

function parseConfirmationId(raw: string | string[] | undefined): string {
  if (typeof raw !== "string" || raw.length === 0) {
    throw new AppError(400, "invalid_confirmation_id", "Invalid confirmation id.");
  }

  return raw;
}

export function createAssistantRouter(
  assistantService: AssistantService | null,
) {
  const assistantRouter = Router();

  function requireService(): AssistantService {
    if (!assistantService) {
      throw new AppError(
        503,
        "assistant_unavailable",
        "Assistant requires a configured database.",
      );
    }

    return assistantService;
  }

  assistantRouter.get("/tools", requireAuth, (req, res) => {
    const service = requireService();
    if (!req.user) {
      throw new AppError(401, "unauthenticated", "Authentication required.");
    }

    const body: AssistantToolsResponse = {
      tools: service.listToolsForUser(req.user),
    };
    res.status(200).json(body);
  });

  assistantRouter.get("/actions", requireAuth, async (req, res) => {
    const service = requireService();
    if (!req.user) {
      throw new AppError(401, "unauthenticated", "Authentication required.");
    }

    const items = await service.listActionLogs(req.user.id);
    const body: AssistantActionLogsResponse = { items };
    res.status(200).json(body);
  });

  assistantRouter.get("/conversations", requireAuth, async (req, res) => {
    const service = requireService();
    if (!req.user) {
      throw new AppError(401, "unauthenticated", "Authentication required.");
    }

    const conversations = await service.listConversations(req.user.id);
    const body: AssistantConversationsResponse = { conversations };
    res.status(200).json(body);
  });

  assistantRouter.post("/conversations", requireAuth, async (req, res) => {
    const service = requireService();
    if (!req.user) {
      throw new AppError(401, "unauthenticated", "Authentication required.");
    }

    const conversation = await service.createConversation(req.user.id);
    const body: AssistantConversationDetail = {
      conversation,
      messages: [],
    };
    res.status(201).json(body);
  });

  assistantRouter.get("/conversations/:conversationId", requireAuth, async (req, res) => {
    const service = requireService();
    if (!req.user) {
      throw new AppError(401, "unauthenticated", "Authentication required.");
    }

    const conversationId = parseConversationId(req.params.conversationId);
    const body: AssistantConversationDetail = await service.getConversation(
      req.user.id,
      conversationId,
    );
    res.status(200).json(body);
  });

  assistantRouter.delete(
    "/conversations/:conversationId",
    requireAuth,
    async (req, res) => {
      const service = requireService();
      if (!req.user) {
        throw new AppError(401, "unauthenticated", "Authentication required.");
      }

      const conversationId = parseConversationId(req.params.conversationId);
      await service.deleteConversation(req.user.id, conversationId);
      res.status(204).end();
    },
  );

  assistantRouter.post(
    "/conversations/:conversationId/messages",
    requireAuth,
    async (req, res) => {
      const service = requireService();
      if (!req.user) {
        throw new AppError(401, "unauthenticated", "Authentication required.");
      }

      const conversationId = parseConversationId(req.params.conversationId);
      const parsed = sendMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, "invalid_body", "Invalid message body.");
      }

      const result = await service.sendMessage(
        req.user,
        conversationId,
        parsed.data.content,
      );

      const body: AssistantSendMessageResponse = {
        userMessage: result.userMessage,
        assistantMessage: result.assistantMessage,
        pendingConfirmationId: result.pendingConfirmationId,
      };
      res.status(200).json(body);
    },
  );

  assistantRouter.post(
    "/confirmations/:confirmationId/approve",
    requireAuth,
    async (req, res) => {
      const service = requireService();
      if (!req.user) {
        throw new AppError(401, "unauthenticated", "Authentication required.");
      }

      const confirmationId = parseConfirmationId(req.params.confirmationId);
      const result = await service.resolveConfirmation(
        req.user,
        confirmationId,
        true,
      );

      const body: AssistantConfirmationResponse = {
        assistantMessage: result.assistantMessage,
      };
      res.status(200).json(body);
    },
  );

  assistantRouter.post(
    "/confirmations/:confirmationId/reject",
    requireAuth,
    async (req, res) => {
      const service = requireService();
      if (!req.user) {
        throw new AppError(401, "unauthenticated", "Authentication required.");
      }

      const confirmationId = parseConfirmationId(req.params.confirmationId);
      const result = await service.resolveConfirmation(
        req.user,
        confirmationId,
        false,
      );

      const body: AssistantConfirmationResponse = {
        assistantMessage: result.assistantMessage,
      };
      res.status(200).json(body);
    },
  );

  return assistantRouter;
}
