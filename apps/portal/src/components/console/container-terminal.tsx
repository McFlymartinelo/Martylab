import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Terminal as Xterm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { Eraser, Play, ShieldAlert, Square } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Unavailable } from "@/components/cockpit/feedback";
import { useDockerContainersQuery } from "@/features/docker/use-docker-query";
import { useMfaStatusQuery } from "@/features/auth/use-mfa";
import {
  useContainerTerminal,
  type ContainerTerminalStatus,
} from "@/features/console/use-container-terminal";
import { cn } from "@/lib/utils";

const SHELLS = ["/bin/sh", "/bin/bash", "/bin/ash"] as const;

const TERMINAL_THEME = {
  background: "#0b0f14",
  foreground: "#e6edf3",
  cursor: "#7dd3fc",
  cursorAccent: "#0b0f14",
  selectionBackground: "#334155",
  black: "#0b0f14",
  red: "#f87171",
  green: "#4ade80",
  yellow: "#facc15",
  blue: "#60a5fa",
  magenta: "#c084fc",
  cyan: "#22d3ee",
  white: "#e2e8f0",
  brightBlack: "#64748b",
  brightRed: "#fca5a5",
  brightGreen: "#86efac",
  brightYellow: "#fde047",
  brightBlue: "#93c5fd",
  brightMagenta: "#d8b4fe",
  brightCyan: "#67e8f9",
  brightWhite: "#f8fafc",
};

const statusLabel: Record<ContainerTerminalStatus, string> = {
  idle: "Déconnecté",
  connecting: "Connexion…",
  connected: "Connecté",
  closed: "Session terminée",
  error: "Erreur",
};

const statusVariant: Record<
  ContainerTerminalStatus,
  "outline" | "info" | "success" | "destructive"
> = {
  idle: "outline",
  connecting: "info",
  connected: "success",
  closed: "outline",
  error: "destructive",
};

export function ContainerTerminal() {
  const dockerQuery = useDockerContainersQuery();
  const mfaQuery = useMfaStatusQuery();
  const containers = useMemo(
    () =>
      dockerQuery.data?.available
        ? dockerQuery.data.containers.filter(
            (container) => container.state === "running",
          )
        : [],
    [dockerQuery.data],
  );

  const [containerId, setContainerId] = useState<string>("");
  const [shell, setShell] = useState<string>("/bin/sh");
  const hostRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Xterm | null>(null);
  const fitRef = useRef<FitAddon | null>(null);

  const writeOutput = useCallback((data: string) => {
    terminalRef.current?.write(data);
  }, []);

  const { status, error, connect, disconnect, sendInput, resize } =
    useContainerTerminal({ onOutput: writeOutput });

  useEffect(() => {
    if (!containerId && containers[0]) {
      setContainerId(containers[0].id);
    }
  }, [containerId, containers]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const terminal = new Xterm({
      cursorBlink: true,
      convertEol: false,
      fontSize: 13,
      fontFamily:
        '"JetBrains Mono Variable", ui-monospace, SFMono-Regular, Menlo, monospace',
      scrollback: 4_000,
      theme: TERMINAL_THEME,
    });
    const fit = new FitAddon();
    terminal.loadAddon(fit);
    terminal.open(host);
    terminalRef.current = terminal;
    fitRef.current = fit;

    const dataDisposable = terminal.onData((data) => sendInput(data));

    const observer = new ResizeObserver(() => {
      try {
        fit.fit();
        resize(terminal.cols, terminal.rows);
      } catch {
        // Le conteneur DOM peut être masqué (onglet inactif).
      }
    });
    observer.observe(host);

    requestAnimationFrame(() => {
      try {
        fit.fit();
        resize(terminal.cols, terminal.rows);
      } catch {
        // Idem : la taille sera recalculée au prochain redimensionnement.
      }
    });

    return () => {
      dataDisposable.dispose();
      observer.disconnect();
      terminal.dispose();
      terminalRef.current = null;
      fitRef.current = null;
    };
    // `dockerQuery` conditionne le montage de la div hôte : l'effet doit être
    // rejoué quand les conteneurs arrivent, sinon xterm ne s'initialise jamais.
  }, [resize, sendInput, dockerQuery.isLoading, dockerQuery.data?.available]);

  function start() {
    const terminal = terminalRef.current;
    const fit = fitRef.current;
    if (!terminal || !containerId) {
      return;
    }

    try {
      fit?.fit();
    } catch {
      // On garde la taille par défaut.
    }

    terminal.clear();
    terminal.focus();
    connect({
      containerId,
      shell,
      cols: fit?.proposeDimensions()?.cols ?? terminal.cols,
      rows: fit?.proposeDimensions()?.rows ?? terminal.rows,
    });
  }

  useEffect(() => {
    if (status === "connected") {
      terminalRef.current?.focus();
    }
  }, [status]);

  const busy = status === "connecting" || status === "connected";

  // Le serveur refuse de toute façon la connexion : on évite d'exposer un
  // terminal inutilisable et on explique la règle.
  if (mfaQuery.data && !mfaQuery.data.sessionVerified) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-amber-500" aria-hidden="true" />
            Second facteur requis
          </CardTitle>
          <CardDescription>
            Le terminal ouvre un shell privilégié : il exige une session
            vérifiée par un second facteur.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {mfaQuery.data.enabled
              ? "Ton compte est protégé, mais cette session a été ouverte avec le seul mot de passe. Déconnecte-toi puis reconnecte-toi en saisissant ton code."
              : "Active l'authentification à deux facteurs (TOTP) depuis les paramètres, puis reconnecte-toi."}
          </p>
          <Button variant="outline" size="sm" render={<Link to="/settings" />}>
            Ouvrir les paramètres
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex min-w-40 flex-1 flex-col gap-1 text-2xs text-muted-foreground">
          Conteneur
          <select
            value={containerId}
            onChange={(event) => setContainerId(event.target.value)}
            disabled={busy || containers.length === 0}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
          >
            {containers.length === 0 ? (
              <option value="">Aucun conteneur en marche</option>
            ) : null}
            {containers.map((container) => (
              <option key={container.id} value={container.id}>
                {container.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex w-36 flex-col gap-1 text-2xs text-muted-foreground">
          Shell
          <select
            value={shell}
            onChange={(event) => setShell(event.target.value)}
            disabled={busy}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
          >
            {SHELLS.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>

        <Button
          type="button"
          onClick={start}
          disabled={busy || !containerId || containers.length === 0}
        >
          <Play className="size-4" aria-hidden="true" />
          {status === "closed" || status === "error" ? "Reconnecter" : "Connecter"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={disconnect}
          disabled={!busy}
        >
          <Square className="size-4" aria-hidden="true" />
          Fermer
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={() => terminalRef.current?.clear()}
        >
          <Eraser className="size-4" aria-hidden="true" />
          Effacer
        </Button>

        <Badge variant={statusVariant[status]} className="ml-auto">
          {statusLabel[status]}
        </Badge>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {dockerQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">
          Chargement des conteneurs…
        </p>
      ) : dockerQuery.data && !dockerQuery.data.available ? (
        <Unavailable
          label="Terminal conteneur"
          reason="Monte /var/run/docker.sock et définis DOCKER_SOCKET_PATH pour activer le terminal."
        />
      ) : (
        <div
          className={cn(
            "overflow-hidden rounded-xl border border-border bg-[#0b0f14] p-2",
            "h-[min(62svh,34rem)] min-h-64",
          )}
        >
          <div ref={hostRef} className="size-full" />
        </div>
      )}

      <p className="text-2xs text-muted-foreground">
        Session Docker `exec` ouverte dans le conteneur sélectionné, après
        vérification du second facteur. Aucun accès au shell de l&apos;hôte,
        aucune élévation de privilèges. Session fermée après 30 minutes
        d&apos;inactivité.
      </p>
    </div>
  );
}
