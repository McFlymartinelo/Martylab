import { Router } from "express";
import type {
  SystemMetricsResponse,
  SystemNetworkResponse,
  SystemProcessesResponse,
} from "@martylab/shared";
import type { ServerMetricsService } from "../connectors/server/server-metrics.js";
import { requireAuth } from "../middleware/auth.js";

export function createSystemRouter(serverMetrics: ServerMetricsService) {
  const systemRouter = Router();

  systemRouter.get("/metrics", requireAuth, async (_req, res, next) => {
    try {
      const metrics = await serverMetrics.getMetrics();
      const body: SystemMetricsResponse = {
        ...metrics,
        cpu: {
          ...metrics.cpu,
          history: serverMetrics.getCpuHistory(),
        },
      };
      res.status(200).json(body);
    } catch (error) {
      next(error);
    }
  });

  systemRouter.get("/network", requireAuth, async (_req, res, next) => {
    try {
      const body: SystemNetworkResponse =
        await serverMetrics.getNetworkStats();
      res.status(200).json(body);
    } catch (error) {
      next(error);
    }
  });

  systemRouter.get("/processes", requireAuth, async (_req, res, next) => {
    try {
      const body: SystemProcessesResponse =
        await serverMetrics.getProcessStats();
      res.status(200).json(body);
    } catch (error) {
      next(error);
    }
  });

  return systemRouter;
}
