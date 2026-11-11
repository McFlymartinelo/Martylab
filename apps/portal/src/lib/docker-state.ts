export type ContainerStateVariant =
  | "success"
  | "secondary"
  | "outline"
  | "destructive";

export function containerStateVariant(state: string): ContainerStateVariant {
  if (state === "running") return "success";
  if (state === "exited" || state === "created") return "secondary";
  if (state === "paused" || state === "restarting") return "outline";
  return "destructive";
}

export function containerStateLabel(state: string): string {
  switch (state) {
    case "running":
      return "en marche";
    case "exited":
      return "arrêté";
    case "paused":
      return "en pause";
    case "restarting":
      return "redémarrage";
    case "created":
      return "créé";
    default:
      return state;
  }
}
