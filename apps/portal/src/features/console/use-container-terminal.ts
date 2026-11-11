import { useCallback, useEffect, useRef, useState } from "react";
import type { ConsoleTerminalServerMessage } from "@martylab/shared";

export type ContainerTerminalStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "closed"
  | "error";

interface ConnectOptions {
  containerId: string;
  shell: string;
  cols: number;
  rows: number;
}

interface UseContainerTerminalOptions {
  onOutput: (data: string) => void;
}

/**
 * Relie un composant xterm au WebSocket du terminal conteneur.
 * L'authentification et le rôle admin sont revérifiés côté serveur pendant
 * la poignée de main : le navigateur ne fait qu'ouvrir le canal.
 */
export function useContainerTerminal({
  onOutput,
}: UseContainerTerminalOptions) {
  const socketRef = useRef<WebSocket | null>(null);
  const outputRef = useRef(onOutput);
  const [status, setStatus] = useState<ContainerTerminalStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    outputRef.current = onOutput;
  }, [onOutput]);

  const disconnect = useCallback(() => {
    const socket = socketRef.current;
    socketRef.current = null;
    if (socket) {
      socket.onclose = null;
      socket.onerror = null;
      socket.close();
    }
    setStatus("idle");
  }, []);

  const connect = useCallback(
    ({ containerId, shell, cols, rows }: ConnectOptions) => {
      disconnect();

      const scheme = window.location.protocol === "https:" ? "wss" : "ws";
      const params = new URLSearchParams({
        container: containerId,
        shell,
        cols: String(Math.max(20, Math.floor(cols))),
        rows: String(Math.max(5, Math.floor(rows))),
      });

      const socket = new WebSocket(
        `${scheme}://${window.location.host}/api/console/terminal?${params.toString()}`,
      );
      socketRef.current = socket;
      setError(null);
      setStatus("connecting");

      socket.onmessage = (event) => {
        let message: ConsoleTerminalServerMessage;
        try {
          message = JSON.parse(String(event.data)) as ConsoleTerminalServerMessage;
        } catch {
          return;
        }

        switch (message.type) {
          case "output":
            outputRef.current(message.data);
            break;
          case "ready":
            setStatus("connected");
            break;
          case "error":
            setError(message.message);
            break;
          case "exit":
            setStatus("closed");
            break;
        }
      };

      socket.onerror = () => {
        setError(
          "Connexion au terminal impossible. Vérifie le rôle admin et le montage du socket Docker.",
        );
        setStatus("error");
      };

      socket.onclose = () => {
        setStatus((current) => (current === "error" ? "error" : "closed"));
      };
    },
    [disconnect],
  );

  const sendInput = useCallback((data: string) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "input", data }));
    }
  }, []);

  const resize = useCallback((cols: number, rows: number) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "resize", cols, rows }));
    }
  }, []);

  useEffect(() => {
    return () => {
      const socket = socketRef.current;
      socketRef.current = null;
      if (socket) {
        socket.onclose = null;
        socket.onerror = null;
        socket.close();
      }
    };
  }, []);

  return { status, error, connect, disconnect, sendInput, resize };
}
