import { Router } from "express";
import type { HealthResponse } from "@martylab/shared";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  const body: HealthResponse = {
    status: "ok",
    service: "martylab-backend",
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(body);
});
