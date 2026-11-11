import { describe, expect, it, vi } from "vitest";
import type { SessionUser } from "@martylab/shared";
import type { DockerClient } from "../connectors/docker/docker-client.js";
import type { ServerMetricsService } from "../connectors/server/server-metrics.js";
import type { SystemInfoService } from "../connectors/server/server-system-info.js";
import type { Logger } from "../lib/logger.js";
import { AppError } from "../lib/errors.js";
import { createConsoleService } from "./console-service.js";
import type { ConsoleRepository } from "./console-repository.js";

const actor: SessionUser = {
  id: "11111111-1111-4111-8111-111111111111",
  username: "alexandre",
  displayName: "Alexandre",
  role: "admin",
  createdAt: new Date().toISOString(),
  mfaEnabled: true,
};

function createHarness() {
  const repository = {
    record: vi.fn().mockResolvedValue(undefined),
    list: vi.fn().mockResolvedValue([]),
  } as unknown as ConsoleRepository;

  const dockerClient = {
    isConfigured: true,
    listContainers: vi.fn().mockResolvedValue([
      {
        id: "abcdef123456",
        name: "jellyfin",
        image: "jellyfin/jellyfin",
        state: "running",
        status: "Up 2 hours",
      },
    ]),
    startContainer: vi.fn().mockResolvedValue(undefined),
    stopContainer: vi.fn().mockResolvedValue(undefined),
    restartContainer: vi.fn().mockResolvedValue(undefined),
    getContainerLogs: vi.fn().mockResolvedValue("log line\n"),
  } as unknown as DockerClient;

  const serverMetrics = {
    getMetrics: vi.fn().mockResolvedValue({
      source: "host",
      timestamp: new Date().toISOString(),
      cpu: { usagePercent: 12.5, cores: 4 },
      memory: { usedBytes: 1024, totalBytes: 4096, usagePercent: 25 },
      storage: {
        usedBytes: 1024,
        totalBytes: 4096,
        usagePercent: 25,
        path: "/",
      },
      uptimeSeconds: 3_600,
      temperatureCelsius: null,
    }),
    getCpuHistory: vi.fn().mockReturnValue([]),
    getNetworkStats: vi.fn().mockResolvedValue({
      source: "host",
      timestamp: new Date().toISOString(),
      receiveBytesPerSecond: 0,
      transmitBytesPerSecond: 0,
      receiveHistory: [],
      transmitHistory: [],
      interfaces: [],
    }),
    getProcessStats: vi.fn().mockResolvedValue({
      source: "host",
      timestamp: new Date().toISOString(),
      processes: [],
    }),
  } as unknown as ServerMetricsService;

  const systemInfo = {
    getOverview: vi.fn().mockResolvedValue({
      source: "host",
      timestamp: new Date().toISOString(),
      facts: {
        hostname: "debian",
        os: "Debian 12",
        kernel: "6.1",
        architecture: "x86_64",
        bootTime: null,
        cpuModel: "Intel",
        governor: null,
      },
      load: null,
      swap: null,
    }),
    getStorage: vi.fn().mockResolvedValue({
      source: "host",
      timestamp: new Date().toISOString(),
      mounts: [],
      diskIo: [],
      raid: [],
    }),
    getHardware: vi.fn().mockResolvedValue({
      source: "host",
      timestamp: new Date().toISOString(),
      facts: {},
      cpuCores: 4,
      sensors: [],
      fans: [],
    }),
  } as unknown as SystemInfoService;

  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    child: vi.fn(),
  } as unknown as Logger;

  const service = createConsoleService({
    dockerClient,
    serverMetrics,
    systemInfo,
    repository,
    logger,
    terminalEnabled: true,
  });

  return { service, repository, dockerClient };
}

describe("console service", () => {
  it("exécute help et journalise un succès", async () => {
    const { service, repository } = createHarness();

    const result = await service.execute(actor, "help", false);

    expect(result.output).toContain("docker restart");
    expect(result.risk).toBe("read");
    expect(repository.record).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        command: "help",
        username: "alexandre",
      }),
    );
  });

  it("refuse une commande inconnue et l'audite", async () => {
    const { service, repository } = createHarness();

    await expect(
      service.execute(actor, "rm -rf /", false),
    ).rejects.toMatchObject({ code: "unknown_command" });

    expect(repository.record).toHaveBeenCalledWith(
      expect.objectContaining({ status: "refused", command: "rm -rf /" }),
    );
  });

  it("exige une confirmation pour une action destructive", async () => {
    const { service, repository, dockerClient } = createHarness();

    await expect(
      service.execute(actor, "docker restart jellyfin", false),
    ).rejects.toBeInstanceOf(AppError);

    expect(dockerClient.restartContainer).not.toHaveBeenCalled();
    expect(repository.record).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending_confirmation" }),
    );
  });

  it("redémarre le conteneur après confirmation", async () => {
    const { service, dockerClient } = createHarness();

    const result = await service.execute(
      actor,
      "docker restart jellyfin",
      true,
    );

    expect(result.output).toContain("redémarré");
    expect(dockerClient.restartContainer).toHaveBeenCalledWith("abcdef123456");
  });

  it("résout un conteneur par préfixe d'identifiant", async () => {
    const { service, repository, dockerClient } = createHarness();

    const result = await service.execute(actor, "docker logs abcdef --lines 20", false);

    expect(result.output).toContain("log line");
    expect(dockerClient.getContainerLogs).toHaveBeenCalledWith(
      "abcdef123456",
      20,
    );
    expect(repository.record).toHaveBeenCalledWith(
      expect.objectContaining({
        outputPreview: "Sortie de logs non conservée dans l'audit.",
      }),
    );
  });
});
