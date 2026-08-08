import webpush from "web-push";
import { and, eq } from "drizzle-orm";
import type { PushSubscribeRequest } from "@martylab/shared";
import type { Database } from "../db/client.js";
import { pushSubscriptions } from "../db/schema.js";
import { AppError } from "../lib/errors.js";

export interface PushServiceConfig {
  publicKey?: string | undefined;
  privateKey?: string | undefined;
  subject?: string | undefined;
}

export function createPushService(
  db: NonNullable<Database>,
  config: PushServiceConfig,
) {
  const isConfigured = Boolean(
    config.publicKey && config.privateKey && config.subject,
  );

  if (isConfigured) {
    webpush.setVapidDetails(
      config.subject!,
      config.publicKey!,
      config.privateKey!,
    );
  }

  return {
    isConfigured,
    publicKey: config.publicKey ?? null,

    async subscribe(userId: string, input: PushSubscribeRequest) {
      if (!isConfigured) {
        throw new AppError(
          503,
          "push_not_configured",
          "Web push is not configured on this server.",
        );
      }

      const existing = await db
        .select({ id: pushSubscriptions.id })
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, input.endpoint))
        .limit(1);

      if (existing[0]) {
        await db
          .update(pushSubscriptions)
          .set({
            userId,
            p256dh: input.keys.p256dh,
            auth: input.keys.auth,
            updatedAt: new Date(),
          })
          .where(eq(pushSubscriptions.endpoint, input.endpoint));
        return;
      }

      await db.insert(pushSubscriptions).values({
        userId,
        endpoint: input.endpoint,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
      });
    },

    async unsubscribe(userId: string, endpoint: string) {
      await db
        .delete(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.userId, userId),
            eq(pushSubscriptions.endpoint, endpoint),
          ),
        );
    },

    async hasSubscription(userId: string): Promise<boolean> {
      const [row] = await db
        .select({ id: pushSubscriptions.id })
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, userId))
        .limit(1);

      return Boolean(row);
    },

    async sendToUser(
      userId: string,
      payload: { title: string; body: string; url?: string },
    ) {
      if (!isConfigured) {
        return;
      }

      const subscriptions = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, userId));

      await Promise.all(
        subscriptions.map(async (subscription) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: subscription.endpoint,
                keys: {
                  p256dh: subscription.p256dh,
                  auth: subscription.auth,
                },
              },
              JSON.stringify(payload),
            );
          } catch (error) {
            const statusCode =
              typeof error === "object" &&
              error !== null &&
              "statusCode" in error
                ? Number((error as { statusCode?: number }).statusCode)
                : null;

            if (statusCode === 404 || statusCode === 410) {
              await db
                .delete(pushSubscriptions)
                .where(eq(pushSubscriptions.id, subscription.id));
            }
          }
        }),
      );
    },

    async listUserIdsWithSubscriptions(): Promise<string[]> {
      const rows = await db
        .selectDistinct({ userId: pushSubscriptions.userId })
        .from(pushSubscriptions);

      return rows.map((row) => row.userId);
    },
  };
}

export type PushService = ReturnType<typeof createPushService>;
