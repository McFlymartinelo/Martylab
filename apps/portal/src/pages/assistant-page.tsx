import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bot, List, Loader2, Plus, Send, Trash2 } from "lucide-react";
import type { AssistantMessage } from "@martylab/shared";
import {
  useAssistantConfirmationMutation,
  useAssistantConversationQuery,
  useAssistantConversationsQuery,
  useCreateAssistantConversationMutation,
  useDeleteAssistantConversationMutation,
  useSendAssistantMessageMutation,
} from "@/features/assistant/use-assistant-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function MessageBubble({ message }: { message: AssistantMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap",
          isUser
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-card text-card-foreground",
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

function ConfirmationActions({
  conversationId,
  confirmationId,
}: {
  conversationId: string;
  confirmationId: string;
}) {
  const confirmationMutation = useAssistantConfirmationMutation(conversationId);

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        disabled={confirmationMutation.isPending}
        onClick={() =>
          confirmationMutation.mutate({ confirmationId, approved: true })
        }
      >
        Confirmer
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={confirmationMutation.isPending}
        onClick={() =>
          confirmationMutation.mutate({ confirmationId, approved: false })
        }
      >
        Annuler
      </Button>
    </div>
  );
}

export function AssistantChat({
  conversationId,
  compact = false,
}: {
  conversationId: string;
  compact?: boolean;
}) {
  const conversationQuery = useAssistantConversationQuery(conversationId);
  const sendMutation = useSendAssistantMessageMutation(conversationId);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = conversationQuery.data?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sendMutation.isPending]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || sendMutation.isPending) {
      return;
    }

    setDraft("");
    sendMutation.mutate(content);
  }

  return (
    <div className={cn("flex flex-col", compact ? "h-[360px]" : "min-h-[60vh]")}>
      <div className="flex-1 space-y-3 overflow-y-auto px-1 py-2">
        {conversationQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : null}

        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            <MessageBubble message={message} />
            {message.metadata?.confirmationId ? (
              <ConfirmationActions
                conversationId={conversationId}
                confirmationId={message.metadata.confirmationId}
              />
            ) : null}
          </div>
        ))}

        {sendMutation.isPending ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            L&apos;assistant réfléchit…
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Pose une question sur la maison, Matchday, Jellyfin…"
          disabled={sendMutation.isPending}
        />
        <Button type="submit" size="icon" disabled={sendMutation.isPending}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}

export function AssistantPage() {
  const conversationsQuery = useAssistantConversationsQuery();
  const createMutation = useCreateAssistantConversationMutation();
  const deleteMutation = useDeleteAssistantConversationMutation();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null,
  );
  const [showConversations, setShowConversations] = useState(false);

  useEffect(() => {
    if (!activeConversationId && conversationsQuery.data?.conversations[0]) {
      setActiveConversationId(conversationsQuery.data.conversations[0].id);
    }
  }, [activeConversationId, conversationsQuery.data?.conversations]);

  async function handleNewConversation() {
    const created = await createMutation.mutateAsync();
    setActiveConversationId(created.conversation.id);
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Assistant</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Interroge tes services connectés via des outils explicites et sécurisés.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card
          className={cn(
            "h-fit lg:block",
            showConversations ? "block" : "hidden",
          )}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Conversations</CardTitle>
            <CardDescription>Historique persistant par utilisateur.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={createMutation.isPending}
              onClick={() => void handleNewConversation()}
            >
              <Plus className="size-4" />
              Nouvelle conversation
            </Button>

            {conversationsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : null}

            <ul className="space-y-1">
              {(conversationsQuery.data?.conversations ?? []).map(
                (conversation) => (
                  <li key={conversation.id} className="flex items-center gap-1">
                    <Button
                      variant={
                        activeConversationId === conversation.id
                          ? "secondary"
                          : "ghost"
                      }
                      size="sm"
                      className="min-w-0 flex-1 justify-start"
                      onClick={() => {
                        setActiveConversationId(conversation.id);
                        setShowConversations(false);
                      }}
                    >
                      <span className="truncate">{conversation.title}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Supprimer la conversation"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        void deleteMutation
                          .mutateAsync(conversation.id)
                          .then(() => {
                            if (activeConversationId === conversation.id) {
                              setActiveConversationId(null);
                            }
                          });
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </li>
                ),
              )}
            </ul>
          </CardContent>
        </Card>

        <Card className="min-h-[60vh] lg:min-h-[70vh]">
          <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bot className="size-4" />
                Conversation
              </CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setShowConversations((value) => !value)}
            >
              <List className="size-4" />
              Conversations
            </Button>
          </CardHeader>
          <CardContent>
            {activeConversationId ? (
              <AssistantChat conversationId={activeConversationId} />
            ) : (
              <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
                <Bot className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Démarre une nouvelle conversation pour commencer.
                </p>
                <Button
                  size="sm"
                  disabled={createMutation.isPending}
                  onClick={() => void handleNewConversation()}
                >
                  Nouvelle conversation
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function AssistantPanel() {
  const createMutation = useCreateAssistantConversationMutation();
  const conversationsQuery = useAssistantConversationsQuery();
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId && conversationsQuery.data?.conversations[0]) {
      setConversationId(conversationsQuery.data.conversations[0].id);
    }
  }, [conversationId, conversationsQuery.data?.conversations]);

  async function ensureConversation() {
    if (conversationId) {
      return conversationId;
    }

    const created = await createMutation.mutateAsync();
    setConversationId(created.conversation.id);
    return created.conversation.id;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">Assistant</h2>
          <p className="text-xs text-muted-foreground">
            Accès rapide à tes services via des outils sécurisés.
          </p>
        </div>
        <Button variant="outline" size="sm" render={<Link to="/assistant" />}>
          Ouvrir l&apos;assistant
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          {conversationId ? (
            <AssistantChat conversationId={conversationId} compact />
          ) : (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Bot className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Aucune conversation pour le moment.
              </p>
              <Button
                size="sm"
                disabled={createMutation.isPending}
                onClick={() => void ensureConversation()}
              >
                Démarrer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
