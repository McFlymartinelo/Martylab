import { Router } from "express";
import type { HealthResponse } from "@martylab/shared";
import type { createDatabase } from "../db/client.js";

type DatabaseHandle = ReturnType<typeof createDatabase>;

export function createHealthRouter(database: DatabaseHandle) {
  const healthRouter = Router();

  healthRouter.get("/live", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "martylab-backend",
      timestamp: new Date().toISOString(),
    });
  });

  healthRouter.get("/", async (_req, res, next) => {
    try {
      const databaseStatus = await database.ping();

      const body: HealthResponse = {
        status: databaseStatus === "up" ? "ok" : "degraded",
        service: "martylab-backend",
        timestamp: new Date().toISOString(),
        database: databaseStatus,
      };

      res.status(200).json(body);
    } catch (error) {
      next(error);
    }
  });

  return healthRouter;
}
