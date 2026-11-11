import { Database, HardDrive, Layers, ScanLine } from "lucide-react";
import type { SystemDiskIoEntry, SystemMountEntry } from "@martylab/shared";
import { useSystemStorageQuery } from "@/features/system/use-system-metrics-query";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/cockpit/data-table";
import { InlineEmpty, Unavailable } from "@/components/cockpit/feedback";
import { MetricLine } from "@/components/cockpit/metric-line";
import { Panel } from "@/components/cockpit/panel";
import { formatBytes, formatBytesPerSecond, formatRate } from "@/lib/format";

function mountCaption(mount: SystemMountEntry): string {
  const usage = `${formatBytes(mount.usedBytes)} / ${formatBytes(mount.totalBytes)}`;
  if (mount.inodeUsagePercent === null) {
    return usage;
  }
  return `${usage} · inodes ${formatRate(mount.inodeUsagePercent)} %`;
}

export function SystemStorageTab() {
  const storageQuery = useSystemStorageQuery();
  const storage = storageQuery.data;

  const diskColumns: DataTableColumn<SystemDiskIoEntry>[] = [
    {
      id: "device",
      header: "Périphérique",
      mono: true,
      render: (disk) => disk.device,
    },
    {
      id: "read",
      header: "Lecture",
      mono: true,
      render: (disk) => formatBytesPerSecond(disk.readBytesPerSecond),
    },
    {
      id: "write",
      header: "Écriture",
      mono: true,
      render: (disk) => formatBytesPerSecond(disk.writeBytesPerSecond),
    },
    {
      id: "readOps",
      header: "IOPS lecture",
      mono: true,
      hideOnMobile: true,
      render: (disk) => formatRate(disk.readOperationsPerSecond),
    },
    {
      id: "writeOps",
      header: "IOPS écriture",
      mono: true,
      hideOnMobile: true,
      render: (disk) => formatRate(disk.writeOperationsPerSecond),
    },
  ];

  return (
    <div className="space-y-4">
      <Panel
        title="Volumes montés"
        icon={HardDrive}
        hint={
          storage ? `${storage.mounts.length} système(s) de fichiers` : undefined
        }
      >
        {storageQuery.isError ? (
          <InlineEmpty
            title="Volumes indisponibles"
            description="Le backend n'a pas pu lire /proc/mounts ou appeler statfs."
          />
        ) : !storage ? (
          <p className="text-sm text-muted-foreground">
            Chargement des volumes…
          </p>
        ) : storage.mounts.length === 0 ? (
          <InlineEmpty
            title="Aucun volume lisible"
            description="Aucun système de fichiers réel n'est accessible depuis le conteneur backend."
          />
        ) : (
          <div className="space-y-4">
            {storage.mounts.map((mount) => (
              <div key={mount.mountPoint}>
                <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm">
                    <span className="font-mono font-medium">{mount.mountPoint}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {mount.fileSystem} · {mount.device}
                    </span>
                  </p>
                  <span className="font-mono text-2xs text-muted-foreground">
                    {formatRate(mount.usagePercent)} %
                  </span>
                </div>
                <MetricLine
                  label={mount.mountPoint}
                  value={`${formatRate(mount.usagePercent)} %`}
                  percent={mount.usagePercent}
                  caption={mountCaption(mount)}
                />
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="I/O disque" icon={Database} bodyClassName="p-0">
        <DataTable
          columns={diskColumns}
          rows={storage?.diskIo ?? []}
          rowKey={(disk) => disk.device}
          caption="Débit disque par périphérique"
          emptyMessage="Aucune activité disque mesurée (ou /proc/diskstats illisible)."
          className="p-2"
        />
      </Panel>

      <Panel title="RAID" icon={Layers} hint="/proc/mdstat">
        {!storage ? (
          <p className="text-sm text-muted-foreground">
            Chargement des arrays RAID…
          </p>
        ) : storage.raid.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun array RAID logiciel détecté.
          </p>
        ) : (
          <ul className="space-y-2">
            {storage.raid.map((array) => (
              <li
                key={array.name}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span className="font-mono">
                  {array.name} · {array.level}
                </span>
                <span className="text-xs text-muted-foreground">
                  {array.activeDevices}/{array.totalDevices} disques
                </span>
                <Badge
                  variant={
                    array.state === "active"
                      ? "success"
                      : array.state === "degraded"
                        ? "warn"
                        : "destructive"
                  }
                >
                  {array.state}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2">
        <Unavailable
          label="SMART"
          reason="La lecture SMART exige smartctl (processus externe et privilèges), hors périmètre lecture seule."
        />
        <Unavailable
          label="Sauvegardes"
          reason="Aucun système de sauvegarde n'est encore implémenté (ADR-013) et aucune donnée n'est simulée."
        />
      </div>

      <p className="flex items-center gap-1.5 text-2xs text-muted-foreground">
        <ScanLine className="size-3.5" aria-hidden="true" />
        Les valeurs proviennent de /proc/mounts, statfs, /proc/diskstats et
        /proc/mdstat.
      </p>
    </div>
  );
}
