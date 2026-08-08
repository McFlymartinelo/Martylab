import { Router } from "express";
import type { NasStatusResponse } from "@martylab/shared";
import type { NasClient } from "../connectors/nas/nas-client.js";
import { requireAuth } from "../middleware/auth.js";

export function createNasRouter(nasClient: NasClient) {
  const nasRouter = Router();

  nasRouter.get("/status", requireAuth, async (_req, res) => {
    const body: NasStatusResponse = await nasClient.checkStatus();
    res.status(200).json(body);
  });

  return nasRouter;
}
