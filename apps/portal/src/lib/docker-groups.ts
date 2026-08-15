import type { DockerContainerSummary } from "@martylab/shared";

export interface DockerAppGroup {
  id: string;
  label: string;
  containers: DockerContainerSummary[];
}

/**
 * Infers the application / compose project from a container name.
 *
 * Examples:
 * - martylab-portal-1 → martylab
 * - immich_shared_server → immich
 * - matchday → matchday
 */
export function inferContainerAppGroup(name: string): string {
  const normalized = name.toLowerCase();
  const hyphenParts = normalized.split("-");

  if (
    hyphenParts.length >= 3 &&
    /^\d+$/.test(hyphenParts[hyphenParts.length - 1] ?? "")
  ) {
    const projectParts = hyphenParts.slice(0, -2);
    return projectParts.join("-") || hyphenParts[0] || normalized;
  }

  if (normalized.includes("_")) {
    return normalized.split("_")[0] || normalized;
  }

  return normalized;
}

export function groupContainersByApp(
  containers: DockerContainerSummary[],
): DockerAppGroup[] {
  const groups = new Map<string, DockerContainerSummary[]>();

  for (const container of containers) {
    const groupId = inferContainerAppGroup(container.name);
    const existing = groups.get(groupId) ?? [];
    existing.push(container);
    groups.set(groupId, existing);
  }

  return [...groups.entries()]
    .map(([id, groupContainers]) => ({
      id,
      label: id,
      containers: [...groupContainers].sort((a, b) =>
        a.name.localeCompare(b.name, "fr"),
      ),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));
}

export function formatGroupStateSummary(
  containers: DockerContainerSummary[],
): string {
  const running = containers.filter((c) => c.state === "running").length;
  const total = containers.length;

  if (running === total) {
    return `${running} running`;
  }

  if (running === 0) {
    return total === 1 ? "arrêté" : `${total} arrêtés`;
  }

  const stopped = total - running;
  return `${running} running · ${stopped} arrêté${stopped > 1 ? "s" : ""}`;
}
