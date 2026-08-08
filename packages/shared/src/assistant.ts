import type { UserRole } from "./index.js";

export type AssistantToolRisk = "read" | "low" | "high";

export type AssistantMessageRole = "user" | "assistant" | "tool";

export type AssistantActionStatus =
  | "executed"
  | "denied"
  | "pending"
  | "failed";

export interface AssistantToolDefinition {
  id: string;
  name: string;
  description: string;
  pluginId: string;
  risk: AssistantToolRisk;
  minRole: UserRole;
  requiresConfirmation: boolean;
  parameters: Record<string, unknown>;
}

export interface AssistantMessageMetadata {
  toolId?: string;
  confirmationId?: string;
  confirmationSummary?: string;
  toolCalls?: Array<{ toolId: string; summary: string }>;
}

export interface AssistantMessage {
  id: string;
  conversationId: string;
  role: AssistantMessageRole;
  content: string;
  metadata: AssistantMessageMetadata | null;
  createdAt: string;
}

export interface AssistantConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssistantConversationDetail {
  conversation: AssistantConversation;
  messages: AssistantMessage[];
}

export interface AssistantConversationsResponse {
  conversations: AssistantConversation[];
}

export interface AssistantSendMessageRequest {
  content: string;
}

export interface AssistantSendMessageResponse {
  userMessage: AssistantMessage;
  assistantMessage: AssistantMessage;
  pendingConfirmationId: string | null;
}

export interface AssistantToolsResponse {
  tools: AssistantToolDefinition[];
}

export interface AssistantActionLogEntry {
  id: string;
  toolId: string;
  risk: AssistantToolRisk;
  status: AssistantActionStatus;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  createdAt: string;
}

export interface AssistantActionLogsResponse {
  items: AssistantActionLogEntry[];
}

export interface AssistantConfirmationResponse {
  assistantMessage: AssistantMessage;
}
