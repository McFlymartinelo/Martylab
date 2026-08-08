import type { SessionUser } from "@martylab/shared";
import type { AssistantToolDefinition } from "@martylab/shared";
import { hasMinRole } from "../lib/permissions.js";
import { AppError } from "../lib/errors.js";
import type { AssistantRepository } from "./assistant-repository.js";
import type { LlmPlanner } from "./llm-planner.js";
import { buildHelpMessage, planToolCalls } from "./planner.js";
import type {
  AssistantTool,
  AssistantToolContext,
  AssistantToolRegistry,
} from "./tools/create-registry.js";

function truncateTitle(content: string): string {
  const trimmed = content.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 60) {
    return trimmed;
  }

  return `${trimmed.slice(0, 57)}…`;
}

function toToolDefinition(tool: AssistantTool): AssistantToolDefinition {
  return {
    id: tool.id,
    name: tool.name,
    description: tool.description,
    pluginId: tool.pluginId,
    risk: tool.risk,
    minRole: tool.minRole,
    requiresConfirmation: tool.requiresConfirmation,
    parameters: tool.parameters,
  };
}

export function createAssistantService(input: {
  repository: AssistantRepository;
  tools: AssistantToolRegistry;
  llmPlanner: LlmPlanner | null;
}) {
  const { repository, tools, llmPlanner } = input;

  function listToolsForUser(user: SessionUser): AssistantToolDefinition[] {
    return tools
      .list()
      .filter((tool) => hasMinRole(user.role, tool.minRole))
      .map(toToolDefinition);
  }

  function getToolForUser(user: SessionUser, toolId: string): AssistantTool {
    const tool = tools.get(toolId);
    if (!tool) {
      throw new AppError(404, "tool_not_found", "Tool not found.");
    }

    if (!hasMinRole(user.role, tool.minRole)) {
      throw new AppError(403, "forbidden", "Insufficient permissions for this tool.");
    }

    return tool;
  }

  async function resolvePlannedCalls(
    user: SessionUser,
    conversationId: string,
    message: string,
  ) {
    const availableTools = tools
      .list()
      .filter((tool) => hasMinRole(user.role, tool.minRole));

    if (llmPlanner) {
      const history = (await repository.listMessages(conversationId))
        .filter((entry) => entry.role === "user" || entry.role === "assistant")
        .slice(-8)
        .map((entry) => ({
          role: entry.role as "user" | "assistant",
          content: entry.content,
        }));

      const llmCalls = await llmPlanner.planToolCalls({
        message,
        tools: availableTools,
        history,
      });

      if (llmCalls.length > 0) {
        return llmCalls;
      }
    }

    return planToolCalls(message);
  }

  async function executeToolCall(input: {
    user: SessionUser;
    conversationId: string;
    toolId: string;
    parameters: Record<string, unknown>;
    skipConfirmation?: boolean;
  }) {
    const tool = getToolForUser(input.user, input.toolId);
    const context: AssistantToolContext = { user: input.user };

    if (tool.requiresConfirmation && !input.skipConfirmation) {
      const confirmationId = await repository.createPendingConfirmation({
        userId: input.user.id,
        conversationId: input.conversationId,
        toolId: tool.id,
        parameters: input.parameters,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      await repository.insertActionLog({
        userId: input.user.id,
        conversationId: input.conversationId,
        toolId: tool.id,
        risk: tool.risk,
        status: "pending",
        input: input.parameters,
        output: null,
      });

      return {
        type: "confirmation" as const,
        confirmationId,
        summary: `Confirmation requise pour ${tool.name}.`,
      };
    }

    try {
      const result = await tool.execute(context, input.parameters);

      await repository.insertActionLog({
        userId: input.user.id,
        conversationId: input.conversationId,
        toolId: tool.id,
        risk: tool.risk,
        status: result.success ? "executed" : "failed",
        input: input.parameters,
        output: result.data ?? { summary: result.summary },
      });

      return {
        type: "result" as const,
        summary: result.summary,
        success: result.success,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur inconnue lors de l'exécution.";

      await repository.insertActionLog({
        userId: input.user.id,
        conversationId: input.conversationId,
        toolId: tool.id,
        risk: tool.risk,
        status: "failed",
        input: input.parameters,
        output: { error: message },
      });

      return {
        type: "result" as const,
        summary: message,
        success: false,
      };
    }
  }

  return {
    listToolsForUser,
    listConversations: (userId: string) => repository.listConversations(userId),
    createConversation: (userId: string) => repository.createConversation(userId),

    async getConversation(userId: string, conversationId: string) {
      const conversation = await repository.getConversationForUser(
        conversationId,
        userId,
      );

      if (!conversation) {
        throw new AppError(404, "conversation_not_found", "Conversation not found.");
      }

      const messages = await repository.listMessages(conversationId);
      return { conversation, messages };
    },

    deleteConversation: (userId: string, conversationId: string) =>
      repository.deleteConversation(conversationId, userId),

    listActionLogs: (userId: string) => repository.listActionLogs(userId),

    async sendMessage(user: SessionUser, conversationId: string, content: string) {
      const conversation = await repository.getConversationForUser(
        conversationId,
        user.id,
      );

      if (!conversation) {
        throw new AppError(404, "conversation_not_found", "Conversation not found.");
      }

      const trimmed = content.trim();
      if (!trimmed) {
        throw new AppError(400, "invalid_message", "Message cannot be empty.");
      }

      const userMessage = await repository.insertMessage({
        conversationId,
        role: "user",
        content: trimmed,
      });

      if (conversation.title === "Nouvelle conversation") {
        await repository.updateConversationTitle(
          conversationId,
          truncateTitle(trimmed),
        );
      }

      const plannedCalls = await resolvePlannedCalls(user, conversationId, trimmed);
      let assistantContent = "";
      let pendingConfirmationId: string | null = null;
      let metadata: Record<string, unknown> | null = null;

      if (plannedCalls.length === 0) {
        assistantContent = buildHelpMessage();
      } else {
        const summaries: string[] = [];

        for (const call of plannedCalls) {
          const outcome = await executeToolCall({
            user,
            conversationId,
            toolId: call.toolId,
            parameters: call.parameters,
          });

          if (outcome.type === "confirmation") {
            pendingConfirmationId = outcome.confirmationId;
            summaries.push(outcome.summary);
            metadata = {
              confirmationId: outcome.confirmationId,
              confirmationSummary: outcome.summary,
              toolId: call.toolId,
            };
            break;
          }

          summaries.push(outcome.summary);
        }

        assistantContent = summaries.join("\n\n");
      }

      const assistantMessage = await repository.insertMessage({
        conversationId,
        role: "assistant",
        content: assistantContent,
        metadata: metadata as never,
      });

      return {
        userMessage,
        assistantMessage,
        pendingConfirmationId,
      };
    },

    async resolveConfirmation(
      user: SessionUser,
      confirmationId: string,
      approved: boolean,
    ) {
      const pending = await repository.getPendingConfirmation(
        confirmationId,
        user.id,
      );

      if (!pending) {
        throw new AppError(
          404,
          "confirmation_not_found",
          "Confirmation not found or expired.",
        );
      }

      await repository.deletePendingConfirmation(confirmationId);

      if (!approved) {
        await repository.insertActionLog({
          userId: user.id,
          conversationId: pending.conversationId,
          toolId: pending.toolId,
          risk: "high",
          status: "denied",
          input: pending.parameters,
          output: null,
        });

        const assistantMessage = await repository.insertMessage({
          conversationId: pending.conversationId,
          role: "assistant",
          content: "Action annulée.",
        });

        return { assistantMessage };
      }

      const outcome = await executeToolCall({
        user,
        conversationId: pending.conversationId,
        toolId: pending.toolId,
        parameters: pending.parameters,
        skipConfirmation: true,
      });

      const assistantMessage = await repository.insertMessage({
        conversationId: pending.conversationId,
        role: "assistant",
        content:
          outcome.type === "result"
            ? outcome.summary
            : "Action exécutée.",
      });

      return { assistantMessage };
    },
  };
}

export type AssistantService = ReturnType<typeof createAssistantService>;
