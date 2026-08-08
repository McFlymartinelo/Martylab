import { Router } from "express";
import type {
  JellyfinPageResponse,
  JellyfinStatusResponse,
  JellyfinSummaryResponse,
} from "@martylab/shared";
import type { JellyfinClient } from "../connectors/jellyfin/jellyfin-client.js";
import { AppError } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";

function parseItemId(raw: string | string[] | undefined): string {
  if (typeof raw !== "string" || raw.length === 0) {
    throw new AppError(400, "invalid_item_id", "Invalid Jellyfin item id.");
  }

  return raw;
}

export function createJellyfinRouter(jellyfinClient: JellyfinClient) {
  const jellyfinRouter = Router();

  jellyfinRouter.get("/status", requireAuth, async (_req, res) => {
    const body: JellyfinStatusResponse = await jellyfinClient.checkHealth();
    res.status(200).json(body);
  });

  jellyfinRouter.get("/summary", requireAuth, async (_req, res) => {
    const body: JellyfinSummaryResponse = await jellyfinClient.getSummary();
    res.status(200).json(body);
  });

  jellyfinRouter.get("/page", requireAuth, async (_req, res) => {
    const body: JellyfinPageResponse = await jellyfinClient.getPage();
    res.status(200).json(body);
  });

  jellyfinRouter.get("/items/:itemId/image", requireAuth, async (req, res) => {
    if (!jellyfinClient.isConfigured) {
      throw new AppError(
        503,
        "jellyfin_not_configured",
        "Jellyfin connector is not configured.",
      );
    }

    const itemId = parseItemId(req.params.itemId);
    const image = await jellyfinClient.getItemImage(itemId);

    if (!image) {
      res.status(404).end();
      return;
    }

    res.setHeader("Content-Type", image.contentType);
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.status(200).send(image.body);
  });

  return jellyfinRouter;
}
