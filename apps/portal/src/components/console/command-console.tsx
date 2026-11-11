import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { CornerDownLeft, Loader2, ShieldAlert, Terminal } from "lucide-react";
import type { ConsoleRisk } from "@martylab/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { CollapsiblePanel } from "@/components/cockpit/collapsible-panel";
import {
  useConsoleCommandsQuery,
  useConsoleExecuteMutation,
} from "@/features/console/use-console-query";
import { ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface ConsoleLine {
  id: string;
  command: string;
  output: string;
  tone: "success" | "error" | "pending";
  risk?: ConsoleRisk;
}

const riskLabel: Record<ConsoleRisk, string> = {
  read: "lecture",
  write: "écriture",
  destructive: "sensible",
};

const riskVariant: Record<ConsoleRisk, "outline" | "warn" | "destructive"> = {
  read: "outline",
  write: "warn",
  destructive: "destructive",
};

export function CommandConsole() {
  const commandsQuery = useConsoleCommandsQuery();
  const executeMutation = useConsoleExecuteMutation();

  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [pending, setPending] = useState<{
    command: string;
    lineId: string;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const counter = useRef(0);

  const commands = commandsQuery.data?.commands ?? [];

  useEffect(() => {
    const node = outputRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [lines]);

  function nextId() {
    counter.current += 1;
    return `line-${counter.current}`;
  }

  async function run(
    command: string,
    confirm: boolean,
    existingLineId?: string,
  ) {
    const lineId = existingLineId ?? nextId();

    if (!existingLineId) {
      setLines((current) => [
        ...current,
        { id: lineId, command, output: "", tone: "pending" },
      ]);
    } else {
      setLines((current) =>
        current.map((line) =>
          line.id === lineId
            ? { ...line, output: "", tone: "pending" }
            : line,
        ),
      );
    }

    try {
      const result = await executeMutation.mutateAsync({
        input: command,
        confirm,
      });
      setLines((current) =>
        current.map((line) =>
          line.id === lineId
            ? {
                ...line,
                output: result.output,
                tone: "success",
                risk: result.risk,
              }
            : line,
        ),
      );
    } catch (error) {
      if (
        error instanceof ApiClientError &&
        error.code === "confirmation_required"
      ) {
        setLines((current) =>
          current.map((line) =>
            line.id === lineId
              ? {
                  ...line,
                  output: "Confirmation explicite requise.",
                  tone: "pending",
                }
              : line,
          ),
        );
        setPending({ command, lineId });
        return;
      }

      setLines((current) =>
        current.map((line) =>
          line.id === lineId
            ? {
                ...line,
                output:
                  error instanceof Error
                    ? error.message
                    : "La commande a échoué.",
                tone: "error",
              }
            : line,
        ),
      );
    }
  }

  function submit(raw: string) {
    const command = raw.trim();
    if (!command) {
      return;
    }

    setHistory((current) => [
      command,
      ...current.filter((entry) => entry !== command),
    ].slice(0, 50));
    setHistoryIndex(-1);
    setInput("");
    void run(command, false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (history.length === 0) return;
      const next = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(next);
      setInput(history[next] ?? "");
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (historyIndex <= 0) {
        setHistoryIndex(-1);
        setInput("");
        return;
      }
      const next = historyIndex - 1;
      setHistoryIndex(next);
      setInput(history[next] ?? "");
      return;
    }

    if (event.key === "l" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      setLines([]);
    }
  }

  function confirmPending() {
    if (!pending) {
      return;
    }
    const { command, lineId } = pending;
    setPending(null);
    void run(command, true, lineId);
  }

  return (
    <div className="space-y-3">
      <div
        ref={outputRef}
        className="h-[min(52svh,28rem)] overflow-auto rounded-xl border border-border bg-muted/20 p-3 font-mono text-xs"
        role="log"
        aria-live="polite"
        aria-label="Sortie de la console"
      >
        {lines.length === 0 ? (
          <div className="space-y-2 text-muted-foreground">
            <p className="flex items-center gap-2 text-foreground">
              <Terminal className="size-4" aria-hidden="true" />
              Console Martylab — allowlist typée
            </p>
            <p>
              Tape <code className="text-foreground">help</code> pour lister les
              commandes. Les actions sensibles demandent une confirmation.
            </p>
            <p>↑ / ↓ parcourt l&apos;historique · Ctrl+L efface l&apos;écran.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {lines.map((line) => (
              <li key={line.id} className="space-y-1">
                <p className="flex flex-wrap items-center gap-2 text-foreground">
                  <span className="text-primary">$</span>
                  <span>{line.command}</span>
                  {line.risk ? (
                    <Badge variant={riskVariant[line.risk]}>
                      {riskLabel[line.risk]}
                    </Badge>
                  ) : null}
                </p>
                <pre
                  className={cn(
                    "whitespace-pre-wrap break-words",
                    line.tone === "error"
                      ? "text-destructive"
                      : line.tone === "pending"
                        ? "text-muted-foreground"
                        : "text-foreground/90",
                  )}
                >
                  {line.output ||
                    (line.tone === "pending" ? "Exécution…" : "(vide)")}
                </pre>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          submit(input);
        }}
      >
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
          <span className="font-mono text-sm text-primary">$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="help"
            spellCheck={false}
            autoComplete="off"
            aria-label="Commande de la console"
            className="h-9 min-w-0 flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
        <Button
          type="submit"
          disabled={executeMutation.isPending || input.trim().length === 0}
        >
          {executeMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <CornerDownLeft className="size-4" aria-hidden="true" />
          )}
          Exécuter
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-2 text-2xs text-muted-foreground">
        <Badge variant="outline">
          <ShieldAlert className="size-3" aria-hidden="true" />
          Admin uniquement
        </Badge>
        <span>
          {commands.length} commandes autorisées · journal d&apos;audit activé
        </span>
      </div>

      <CollapsiblePanel
        panelId="console:commands"
        title="Commandes autorisées"
        icon={Terminal}
        hint={`${commands.length} commandes`}
      >
        {commandsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {commands.map((command) => (
              <li
                key={command.id}
                className="rounded-lg border border-border bg-muted/20 p-2.5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <code className="font-mono text-xs text-foreground">
                    {command.usage}
                  </code>
                  <Badge variant={riskVariant[command.risk]}>
                    {riskLabel[command.risk]}
                  </Badge>
                </div>
                <p className="mt-1 text-2xs text-muted-foreground">
                  {command.description}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CollapsiblePanel>

      <Dialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
      >
        <DialogBackdrop />
        <DialogPopup>
          <DialogTitle>Confirmer la commande</DialogTitle>
          <DialogDescription>
            Cette commande peut modifier l&apos;état de tes services. Elle sera
            journalisée avec ton compte.
          </DialogDescription>
          <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs whitespace-pre-wrap">
            {pending?.command}
          </pre>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <DialogClose
              className="h-8 rounded-lg border border-border px-3 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50"
              aria-label="Annuler la commande"
            >
              Annuler
            </DialogClose>
            <Button type="button" variant="destructive" onClick={confirmPending}>
              Confirmer
            </Button>
          </div>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
