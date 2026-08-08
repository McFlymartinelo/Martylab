import { Router } from "express";
import { z } from "zod";
import type {
  OrionClimateResponse,
  OrionLightsResponse,
  OrionSetLightResponse,
  OrionStatusResponse,
} from "@martylab/shared";
import type { OrionClient } from "../connectors/orion/orion-client.js";
import { AppError } from "../lib/errors.js";
import { requireAuth, requireMinRole } from "../middleware/auth.js";

const setLightBodySchema = z
  .object({
    on: z.boolean().optional(),
    brightness: z.number().int().min(1).max(100).optional(),
  })
  .refine(
    (value) => value.on !== undefined || value.brightness !== undefined,
    "At least one of on or brightness is required.",
  );

function parseLightId(raw: string | string[] | undefined): string {
  if (typeof raw !== "string" || raw.length === 0) {
    throw new AppError(400, "invalid_light_id", "Invalid light id.");
  }
  return raw;
}

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

  orionRouter.get("/lights", requireAuth, async (_req, res) => {
    const body: OrionLightsResponse = await orionClient.getLights();
    res.status(200).json(body);
  });

  orionRouter.put(
    "/lights/:lightId",
    requireAuth,
    requireMinRole("user"),
    async (req, res, next) => {
      try {
        if (!orionClient.isConfigured) {
          throw new AppError(
            503,
            "orion_not_configured",
            "Orion connector is not configured.",
          );
        }

        const lightId = parseLightId(req.params.lightId);
        const parsed = setLightBodySchema.safeParse(req.body);
        if (!parsed.success) {
          throw new AppError(400, "invalid_body", "Invalid light control body.");
        }

        const body: OrionSetLightResponse = await orionClient.setLightState(
          lightId,
          {
            ...(parsed.data.on !== undefined ? { on: parsed.data.on } : {}),
            ...(parsed.data.brightness !== undefined
              ? { brightness: parsed.data.brightness }
              : {}),
          },
        );
        res.status(200).json(body);
      } catch (error) {
        if (error instanceof AppError) {
          next(error);
          return;
        }

        next(
          new AppError(
            503,
            "orion_unavailable",
            "Unable to control the light via Orion.",
            { cause: error },
          ),
        );
      }
    },
  );

  return orionRouter;
}
