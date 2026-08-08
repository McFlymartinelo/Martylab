import { Router } from "express";
import type {
  OrionClimateResponse,
  OrionStatusResponse,
} from "@martylab/shared";
import type { OrionClient } from "../connectors/orion/orion-client.js";
import { requireAuth } from "../middleware/auth.js";

export function createOrionRouter(orionClient: OrionClient) {
  const orionRouter = Router();

  orionRouter.get("/status", requireAuth, async (_req, res) => {
    const online = orionClient.isConfigured
      ? await orionClient.checkHealth()
      : false;

    const body: OrionStatusResponse = {
      configured: orionClient.isConfigured,
      online,
    };
    res.status(200).json(body);
  });

  orionRouter.get("/climate", requireAuth, async (_req, res) => {
    const body: OrionClimateResponse = await orionClient.getClimate();
    res.status(200).json(body);
  });

  return orionRouter;
}
