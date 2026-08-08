import type {
  AssistantActionLogsResponse,
  AssistantConfirmationResponse,
  AssistantConversationDetail,
  AssistantConversationsResponse,
  AssistantSendMessageRequest,
  AssistantSendMessageResponse,
  AssistantToolsResponse,
} from "@martylab/shared";
import { apiDelete, apiGet, apiPost } from "@/lib/api-client";

export function fetchAssistantConversations(): Promise<AssistantConversationsResponse> {
  return apiGet<AssistantConversationsResponse>("/api/assistant/conversations");
}

export function createAssistantConversation(): Promise<AssistantConversationDetail> {
  return apiPost<AssistantConversationDetail>("/api/assistant/conversations");
}

export function fetchAssistantConversation(
  conversationId: string,
): Promise<AssistantConversationDetail> {
  return apiGet<AssistantConversationDetail>(
    `/api/assistant/conversations/${conversationId}`,
  );
}

export function deleteAssistantConversation(
  conversationId: string,
): Promise<void> {
  return apiDelete(`/api/assistant/conversations/${conversationId}`);
}

export function sendAssistantMessage(
  conversationId: string,
  body: AssistantSendMessageRequest,
): Promise<AssistantSendMessageResponse> {
  return apiPost<AssistantSendMessageResponse>(
    `/api/assistant/conversations/${conversationId}/messages`,
    body,
  );
}

export function approveAssistantConfirmation(
  confirmationId: string,
): Promise<AssistantConfirmationResponse> {
  return apiPost<AssistantConfirmationResponse>(
    `/api/assistant/confirmations/${confirmationId}/approve`,
  );
}

export function rejectAssistantConfirmation(
  confirmationId: string,
): Promise<AssistantConfirmationResponse> {
  return apiPost<AssistantConfirmationResponse>(
    `/api/assistant/confirmations/${confirmationId}/reject`,
  );
}

export function fetchAssistantTools(): Promise<AssistantToolsResponse> {
  return apiGet<AssistantToolsResponse>("/api/assistant/tools");
}

export function fetchAssistantActionLogs(): Promise<AssistantActionLogsResponse> {
  return apiGet<AssistantActionLogsResponse>("/api/assistant/actions");
}
