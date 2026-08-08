import { Router } from "express";
import type {
  PortainerOverviewResponse,
  PortainerStatusResponse,
} from "@martylab/shared";
import type { PortainerClient } from "../connectors/portainer/portainer-client.js";
import { AppError } from "../lib/errors.js";
import { requireAuth, requireMinRole } from "../middleware/auth.js";

export function createPortainerRouter(portainerClient: PortainerClient) {
  const portainerRouter = Router();

  portainerRouter.get("/status", requireAuth, async (_req, res) => {
    const body: PortainerStatusResponse = await portainerClient.checkStatus();
    res.status(200).json(body);
  });

  portainerRouter.get("/overview", requireAuth, async (_req, res) => {
    const body: PortainerOverviewResponse = await portainerClient.getOverview();
    res.status(200).json(body);
  });

  portainerRouter.post(
    "/containers/:containerId/:action",
    requireAuth,
    requireMinRole("user"),
    async (req, res, next) => {
      const containerId = req.params.containerId;
      const action = req.params.action;

      if (
        typeof containerId !== "string" ||
        (action !== "start" && action !== "stop" && action !== "restart")
      ) {
        next(new AppError(400, "invalid_action", "Invalid container action."));
        return;
      }

      if (!portainerClient.isConfigured) {
        next(
          new AppError(503, "portainer_not_configured", "Portainer is not configured."),
        );
        return;
      }

      try {
        await portainerClient.containerAction(containerId, action);
        res.status(200).json({ ok: true });
      } catch (error) {
        next(
          new AppError(
            503,
            "portainer_action_failed",
            "Portainer action failed.",
            { cause: error },
          ),
        );
      }
    },
  );

  return portainerRouter;
}
