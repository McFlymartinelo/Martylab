import { Router } from "express";
import type {
  SystemHardwareResponse,
  SystemMetricsResponse,
  SystemNetworkResponse,
  SystemOverviewResponse,
  SystemProcessesResponse,
  SystemStorageResponse,
} from "@martylab/shared";
import type { ServerMetricsService } from "../connectors/server/server-metrics.js";
import type { SystemInfoService } from "../connectors/server/server-system-info.js";
import { AppError } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";

/** /proc absent (Windows, ou conteneur sans HOST_PROC_PREFIX) : état prévu. */
function isProcUnavailable(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "ENOENT"
  );
}

function unavailableError(error: unknown): AppError {
  return new AppError(
    503,
    "metrics_unavailable",
    "Les métriques hôte nécessitent Linux (/proc). En développement Windows, cet écran reste vide.",
    { cause: error },
  );
}

export function createSystemRouter(
  serverMetrics: ServerMetricsService,
  systemInfo: SystemInfoService,
) {
  const systemRouter = Router();

  // Endpoint « live » : CPU, RAM, disque, uptime, température et réseau, sans
  // le scan des processus (≈250 lectures /proc/[pid]). Il peut donc être
  // interrogé chaque seconde sans charge inutile.
  systemRouter.get("/live", requireAuth, async (_req, res, next) => {
    try {
      const [metrics, network] = await Promise.all([
        serverMetrics.getMetrics(),
        serverMetrics.getNetworkStats(),
      ]);
      const body: SystemMetricsResponse = {
        ...metrics,
        cpu: {
          ...metrics.cpu,
          history: serverMetrics.getCpuHistory(),
        },
        network: {
          receiveBytesPerSecond: network.receiveBytesPerSecond,
          transmitBytesPerSecond: network.transmitBytesPerSecond,
          receiveHistory: network.receiveHistory,
          transmitHistory: network.transmitHistory,
          interfaces: network.interfaces,
        },
      };
      res.status(200).json(body);
    } catch (error) {
      next(isProcUnavailable(error) ? unavailableError(error) : error);
    }
  });

  systemRouter.get("/metrics", requireAuth, async (_req, res, next) => {
    try {
      const [metrics, network, processes] = await Promise.all([
        serverMetrics.getMetrics(),
        serverMetrics.getNetworkStats(),
        serverMetrics.getProcessStats(),
      ]);
      const body: SystemMetricsResponse = {
        ...metrics,
        cpu: {
          ...metrics.cpu,
          history: serverMetrics.getCpuHistory(),
        },
        network: {
          receiveBytesPerSecond: network.receiveBytesPerSecond,
          transmitBytesPerSecond: network.transmitBytesPerSecond,
          receiveHistory: network.receiveHistory,
          transmitHistory: network.transmitHistory,
          interfaces: network.interfaces,
        },
        processes: processes.processes,
      };
      res.status(200).json(body);
    } catch (error) {
      next(isProcUnavailable(error) ? unavailableError(error) : error);
    }
  });

  systemRouter.get("/network", requireAuth, async (_req, res, next) => {
    try {
      const body: SystemNetworkResponse =
        await serverMetrics.getNetworkStats();
      res.status(200).json(body);
    } catch (error) {
      next(isProcUnavailable(error) ? unavailableError(error) : error);
    }
  });

  systemRouter.get("/processes", requireAuth, async (_req, res, next) => {
    try {
      const body: SystemProcessesResponse =
        await serverMetrics.getProcessStats();
      res.status(200).json(body);
    } catch (error) {
      next(isProcUnavailable(error) ? unavailableError(error) : error);
    }
  });

  systemRouter.get("/overview", requireAuth, async (_req, res, next) => {
    try {
      const body: SystemOverviewResponse = await systemInfo.getOverview();
      res.status(200).json(body);
    } catch (error) {
      next(isProcUnavailable(error) ? unavailableError(error) : error);
    }
  });

  systemRouter.get("/storage", requireAuth, async (_req, res, next) => {
    try {
      const body: SystemStorageResponse = await systemInfo.getStorage();
      res.status(200).json(body);
    } catch (error) {
      next(isProcUnavailable(error) ? unavailableError(error) : error);
    }
  });

  systemRouter.get("/hardware", requireAuth, async (_req, res, next) => {
    try {
      const body: SystemHardwareResponse = await systemInfo.getHardware();
      res.status(200).json(body);
    } catch (error) {
      next(isProcUnavailable(error) ? unavailableError(error) : error);
    }
  });

  return systemRouter;
}
