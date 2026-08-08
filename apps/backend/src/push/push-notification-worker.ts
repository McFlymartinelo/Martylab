import { eq } from "drizzle-orm";
import type { Database } from "../db/client.js";
import { pushNotificationSnapshots } from "../db/schema.js";
import type { MatchdayClient } from "../connectors/matchday/matchday-client.js";
import type { OrionClient } from "../connectors/orion/orion-client.js";
import type { PushService } from "./push-service.js";
import type { Logger } from "../lib/logger.js";

interface UserLookup {
  id: string;
  username: string;
  displayName: string;
}

function fingerprintFromItems(items: Array<{ id: string; severity: string }>) {
  return items
    .map((item) => `${item.id}:${item.severity}`)
    .sort()
    .join("|");
}

export function createPushNotificationWorker(input: {
  db: NonNullable<Database>;
  pushService: PushService;
  orionClient: OrionClient;
  matchdayClient: MatchdayClient;
  lookupUser: (userId: string) => Promise<UserLookup | null>;
  logger: Logger;
  intervalMs?: number;
}) {
  const intervalMs = input.intervalMs ?? 5 * 60 * 1000;
  let timer: NodeJS.Timeout | null = null;

  async function collectDigest(user: UserLookup) {
    const items: Array<{ id: string; severity: string; title: string; message: string }> = [];

    if (input.orionClient.isConfigured) {
      const online = await input.orionClient.checkHealth();
      if (online) {
        const orion = await input.orionClient.getNotifications();
        for (const item of orion.items) {
          if (item.severity === "warning" || item.severity === "critical") {
            items.push({
              id: `orion-${item.id}`,
              severity: item.severity,
              title: item.title,
              message: item.message,
            });
          }
        }
      }
    }

    if (input.matchdayClient.isConfigured) {
      const health = await input.matchdayClient.checkHealth();
      if (health.configured && health.online) {
        const matchday = await input.matchdayClient.getNotifications({
          martylabUsername: user.username,
          martylabDisplayName: user.displayName,
        });

        for (const item of matchday.items) {
          if (item.severity === "warning") {
            items.push({
              id: `matchday-${item.id}`,
              severity: item.severity,
              title: item.title,
              message: item.message,
            });
          }
        }
      }
    }

    return items;
  }

  async function tick() {
    if (!input.pushService.isConfigured) {
      return;
    }

    const userIds = await input.pushService.listUserIdsWithSubscriptions();

    for (const userId of userIds) {
      try {
        const user = await input.lookupUser(userId);
        if (!user) {
          continue;
        }

        const items = await collectDigest(user);
        const fingerprint = fingerprintFromItems(items);

        const [snapshot] = await input.db
          .select()
          .from(pushNotificationSnapshots)
          .where(eq(pushNotificationSnapshots.userId, userId))
          .limit(1);

        if (snapshot?.fingerprint === fingerprint) {
          continue;
        }

        if (snapshot) {
          await input.db
            .update(pushNotificationSnapshots)
            .set({ fingerprint, updatedAt: new Date() })
            .where(eq(pushNotificationSnapshots.userId, userId));
        } else {
          await input.db.insert(pushNotificationSnapshots).values({
            userId,
            fingerprint,
          });
        }

        if (items.length === 0) {
          continue;
        }

        const primary = items[0]!;
        await input.pushService.sendToUser(userId, {
          title: primary.title,
          body:
            items.length > 1
              ? `${primary.message} (+${items.length - 1} autre(s))`
              : primary.message,
          url: "/",
        });
      } catch (error) {
        input.logger.warn({ err: error, userId }, "Push notification tick failed");
      }
    }
  }

  return {
    start() {
      if (!input.pushService.isConfigured || timer) {
        return;
      }

      timer = setInterval(() => {
        void tick();
      }, intervalMs);

      void tick();
    },

    stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    },
  };
}
