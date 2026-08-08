import { Router } from "express";
import type { CloudflareStatusResponse } from "@martylab/shared";
import type { CloudflareClient } from "../connectors/cloudflare/cloudflare-client.js";
import { requireAuth } from "../middleware/auth.js";

export function createCloudflareRouter(cloudflareClient: CloudflareClient) {
  const cloudflareRouter = Router();

  cloudflareRouter.get("/status", requireAuth, async (_req, res) => {
    const body: CloudflareStatusResponse = await cloudflareClient.checkStatus();
    res.status(200).json(body);
  });

  return cloudflareRouter;
}
