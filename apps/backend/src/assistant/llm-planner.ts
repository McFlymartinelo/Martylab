import type { AssistantTool } from "./tools/create-registry.js";

interface LlmToolCall {
  toolId: string;
  parameters: Record<string, unknown>;
}

interface LlmPlannerConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
}

function toOpenAiTools(tools: AssistantTool[]) {
  return tools.map((tool) => ({
    type: "function" as const,
    function: {
      name: toOpenAiToolName(tool.id),
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

function toOpenAiToolName(toolId: string): string {
  return toolId.replace(/\./g, "__");
}

function fromOpenAiToolName(name: string): string {
  return name.replace(/__/g, ".");
}

export function createLlmPlanner(config: LlmPlannerConfig) {
  const baseUrl = config.baseUrl.replace(/\/+$/, "");

  return {
    isConfigured: true,

    async planToolCalls(input: {
      message: string;
      tools: AssistantTool[];
      history: Array<{ role: "user" | "assistant"; content: string }>;
    }): Promise<LlmToolCall[]> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

      try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.model,
            temperature: 0.2,
            messages: [
              {
                role: "system",
                content:
                  "Tu es l'assistant Martylab. Utilise les outils disponibles pour répondre aux demandes sur la maison, Matchday, Jellyfin, Docker et l'infrastructure. Réponds en français.",
              },
              ...input.history.map((entry) => ({
                role: entry.role,
                content: entry.content,
              })),
              { role: "user", content: input.message },
            ],
            tools: toOpenAiTools(input.tools),
            tool_choice: "auto",
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          return [];
        }

        const payload = (await response.json()) as {
          choices?: Array<{
            message?: {
              tool_calls?: Array<{
                function?: {
                  name?: string;
                  arguments?: string;
                };
              }>;
            };
          }>;
        };

        const toolCalls = payload.choices?.[0]?.message?.tool_calls ?? [];

        return toolCalls
          .map((call) => {
            const name = call.function?.name;
            if (!name) {
              return null;
            }

            let parameters: Record<string, unknown> = {};
            try {
              parameters = JSON.parse(call.function?.arguments ?? "{}") as Record<
                string,
                unknown
              >;
            } catch {
              parameters = {};
            }

            return {
              toolId: fromOpenAiToolName(name),
              parameters,
            };
          })
          .filter((call): call is LlmToolCall => call !== null);
      } catch {
        return [];
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

export type LlmPlanner = ReturnType<typeof createLlmPlanner>;
