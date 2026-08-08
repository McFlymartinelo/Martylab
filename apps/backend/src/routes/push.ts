import { Router } from "express";
import { z } from "zod";
import type {
  PushPublicKeyResponse,
  PushStatusResponse,
  PushSubscribeResponse,
} from "@martylab/shared";
import type { PushService } from "../push/push-service.js";
import { AppError } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export function createPushRouter(pushService: PushService | null) {
  const pushRouter = Router();

  function requirePushService(): PushService {
    if (!pushService) {
      throw new AppError(
        503,
        "push_unavailable",
        "Push notifications require a configured database.",
      );
    }

    return pushService;
  }

  pushRouter.get("/public-key", requireAuth, (_req, res) => {
    const service = requirePushService();
    const body: PushPublicKeyResponse = {
      configured: service.isConfigured,
      publicKey: service.publicKey,
    };
    res.status(200).json(body);
  });

  pushRouter.get("/status", requireAuth, async (req, res) => {
    const service = requirePushService();
    if (!req.user) {
      throw new AppError(401, "unauthenticated", "Authentication required.");
    }

    const body: PushStatusResponse = {
      configured: service.isConfigured,
      subscribed: await service.hasSubscription(req.user.id),
    };
    res.status(200).json(body);
  });

  pushRouter.post("/subscribe", requireAuth, async (req, res) => {
    const service = requirePushService();
    if (!req.user) {
      throw new AppError(401, "unauthenticated", "Authentication required.");
    }

    const parsed = subscribeSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, "invalid_body", "Invalid push subscription body.");
    }

    await service.subscribe(req.user.id, parsed.data);

    const body: PushSubscribeResponse = { subscribed: true };
    res.status(200).json(body);
  });

  pushRouter.post("/unsubscribe", requireAuth, async (req, res) => {
    const service = requirePushService();
    if (!req.user) {
      throw new AppError(401, "unauthenticated", "Authentication required.");
    }

    const parsed = unsubscribeSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, "invalid_body", "Invalid push unsubscribe body.");
    }

    await service.unsubscribe(req.user.id, parsed.data.endpoint);
    res.status(204).end();
  });

  pushRouter.post("/test", requireAuth, async (req, res) => {
    const service = requirePushService();
    if (!req.user) {
      throw new AppError(401, "unauthenticated", "Authentication required.");
    }

    if (!service.isConfigured) {
      throw new AppError(
        503,
        "push_not_configured",
        "Web push is not configured.",
      );
    }

    await service.sendToUser(req.user.id, {
      title: "Martylab",
      body: "Les notifications push fonctionnent.",
      url: "/",
    });

    res.status(204).end();
  });

  return pushRouter;
}
