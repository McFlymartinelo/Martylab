import { Router } from "express";
import type {
  ImmichInstanceId,
  ImmichPageResponse,
  ImmichStatusResponse,
  ImmichSummaryResponse,
} from "@martylab/shared";
import type { ImmichClient } from "../connectors/immich/immich-client.js";
import { AppError } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";

const INSTANCE_IDS = new Set<ImmichInstanceId>(["photos", "photosshared"]);

function parseInstanceId(raw: string | string[] | undefined): ImmichInstanceId {
  if (typeof raw !== "string" || !INSTANCE_IDS.has(raw as ImmichInstanceId)) {
    throw new AppError(400, "invalid_instance_id", "Invalid Immich instance id.");
  }

  return raw as ImmichInstanceId;
}

function parseAssetId(raw: string | string[] | undefined): string {
  if (typeof raw !== "string" || raw.length === 0) {
    throw new AppError(400, "invalid_asset_id", "Invalid Immich asset id.");
  }

  return raw;
}

export function createImmichRouter(immichClient: ImmichClient) {
  const immichRouter = Router();

  immichRouter.get("/status", requireAuth, async (_req, res) => {
    const body: ImmichStatusResponse = await immichClient.checkHealth();
    res.status(200).json(body);
  });

  immichRouter.get("/summary", requireAuth, async (_req, res) => {
    const body: ImmichSummaryResponse = await immichClient.getSummary();
    res.status(200).json(body);
  });

  immichRouter.get("/page", requireAuth, async (_req, res) => {
    const body: ImmichPageResponse = await immichClient.getPage();
    res.status(200).json(body);
  });

  immichRouter.get(
    "/:instanceId/assets/:assetId/thumbnail",
    requireAuth,
    async (req, res) => {
      if (!immichClient.isConfigured) {
        throw new AppError(
          503,
          "immich_not_configured",
          "Immich connector is not configured.",
        );
      }

      const instanceId = parseInstanceId(req.params.instanceId);
      const assetId = parseAssetId(req.params.assetId);
      const instance = immichClient.getInstance(instanceId);

      if (!instance?.isConfigured) {
        throw new AppError(
          503,
          "immich_instance_not_configured",
          "This Immich instance is not configured.",
        );
      }

      const thumbnail = await instance.getAssetThumbnail(assetId);

      if (!thumbnail) {
        res.status(404).end();
        return;
      }

      res.setHeader("Content-Type", thumbnail.contentType);
      res.setHeader("Cache-Control", "private, max-age=3600");
      res.status(200).send(thumbnail.body);
    },
  );

  return immichRouter;
}
