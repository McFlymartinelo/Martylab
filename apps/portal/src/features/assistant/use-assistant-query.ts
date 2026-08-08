import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveAssistantConfirmation,
  createAssistantConversation,
  deleteAssistantConversation,
  fetchAssistantActionLogs,
  fetchAssistantConversation,
  fetchAssistantConversations,
  fetchAssistantTools,
  rejectAssistantConfirmation,
  sendAssistantMessage,
} from "@/features/assistant/assistant-api";

export const assistantConversationsQueryKey = ["assistant", "conversations"] as const;
export const assistantToolsQueryKey = ["assistant", "tools"] as const;
export const assistantActionsQueryKey = ["assistant", "actions"] as const;

export function assistantConversationQueryKey(conversationId: string) {
  return ["assistant", "conversation", conversationId] as const;
}

export function useAssistantConversationsQuery() {
  return useQuery({
    queryKey: assistantConversationsQueryKey,
    queryFn: fetchAssistantConversations,
  });
}

export function useAssistantConversationQuery(
  conversationId: string | null,
) {
  return useQuery({
    queryKey: conversationId
      ? assistantConversationQueryKey(conversationId)
      : ["assistant", "conversation", "none"],
    queryFn: () => fetchAssistantConversation(conversationId!),
    enabled: Boolean(conversationId),
  });
}

export function useAssistantToolsQuery() {
  return useQuery({
    queryKey: assistantToolsQueryKey,
    queryFn: fetchAssistantTools,
  });
}

export function useAssistantActionLogsQuery() {
  return useQuery({
    queryKey: assistantActionsQueryKey,
    queryFn: fetchAssistantActionLogs,
  });
}

export function useCreateAssistantConversationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAssistantConversation,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: assistantConversationsQueryKey,
      });
    },
  });
}

export function useDeleteAssistantConversationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAssistantConversation,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: assistantConversationsQueryKey,
      });
    },
  });
}

export function useSendAssistantMessageMutation(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) =>
      sendAssistantMessage(conversationId, { content }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: assistantConversationQueryKey(conversationId),
      });
      void queryClient.invalidateQueries({
        queryKey: assistantConversationsQueryKey,
      });
      void queryClient.invalidateQueries({
        queryKey: assistantActionsQueryKey,
      });
    },
  });
}

export function useAssistantConfirmationMutation(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      confirmationId: string;
      approved: boolean;
    }) =>
      input.approved
        ? approveAssistantConfirmation(input.confirmationId)
        : rejectAssistantConfirmation(input.confirmationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: assistantConversationQueryKey(conversationId),
      });
      void queryClient.invalidateQueries({
        queryKey: assistantActionsQueryKey,
      });
    },
  });
}
