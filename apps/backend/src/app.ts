import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { createSessionService } from "./auth/session-service.js";
import type { Env } from "./config/env.js";
import type { createDatabase } from "./db/client.js";
import type { Logger } from "./lib/logger.js";
import {
  createErrorHandler,
  notFoundHandler,
} from "./middleware/error-handler.js";
import {
  createOriginGuard,
  createSessionMiddleware,
  requireAuth,
} from "./middleware/auth.js";
import { createAuthRouter } from "./routes/auth.js";
import { createDockerRouter } from "./routes/docker.js";
import { createHealthRouter } from "./routes/health.js";
import { pluginsRouter } from "./routes/plugins.js";
import { createSystemRouter } from "./routes/system.js";
import { createUsersRouter } from "./routes/users.js";
import { createOrionRouter } from "./routes/orion.js";
import { createMatchdayRouter } from "./routes/matchday.js";
import { createPortainerRouter } from "./routes/portainer.js";
import { createCloudflareRouter } from "./routes/cloudflare.js";
import { createNasRouter } from "./routes/nas.js";
import { createJellyfinRouter } from "./routes/jellyfin.js";
import { createImmichRouter } from "./routes/immich.js";
import { createAssistantRouter } from "./routes/assistant.js";
import { createDockerClient } from "./connectors/docker/docker-client.js";
import { createOrionClient } from "./connectors/orion/orion-client.js";
import { createMatchdayClient } from "./connectors/matchday/matchday-client.js";
import { createPortainerClient } from "./connectors/portainer/portainer-client.js";
import { createCloudflareClient } from "./connectors/cloudflare/cloudflare-client.js";
import { createNasClient } from "./connectors/nas/nas-client.js";
import { createJellyfinClient } from "./connectors/jellyfin/jellyfin-client.js";
import { createImmichClient } from "./connectors/immich/immich-client.js";
import { createServerMetricsService } from "./connectors/server/server-metrics.js";
import { createUserService } from "./users/user-service.js";
import { createAssistantRepository } from "./assistant/assistant-repository.js";
import { createAssistantService } from "./assistant/assistant-service.js";
import { createAssistantToolRegistry } from "./assistant/tools/create-registry.js";
import { createLlmPlanner } from "./assistant/llm-planner.js";
import { createPushService } from "./push/push-service.js";
import { createPushNotificationWorker } from "./push/push-notification-worker.js";
import { createPushRouter } from "./routes/push.js";

type DatabaseHandle = ReturnType<typeof createDatabase>;

export function createApp(env: Env, logger: Logger, database: DatabaseHandle) {
  const app = express();
  const sessionService = database.db
    ? createSessionService(database.db, env)
    : null;
  const userService = database.db ? createUserService(database.db) : null;
  const serverMetrics = createServerMetricsService({
    hostProcPrefix: env.HOST_PROC_PREFIX,
    hostSysPrefix: env.HOST_SYS_PREFIX,
    hostRootPath: env.HOST_ROOT_PATH,
  });
  const dockerClient = createDockerClient(env.DOCKER_SOCKET_PATH);
  const orionClient = createOrionClient({
    baseUrl: env.ORION_URL,
    publicUrl: env.ORION_PUBLIC_URL ?? env.ORION_URL,
    apiKey: env.ORION_API_KEY,
    timeoutMs: env.ORION_TIMEOUT_MS,
  });
  const matchdayClient = createMatchdayClient({
    baseUrl: env.MATCHDAY_URL,
    publicUrl: env.MATCHDAY_PUBLIC_URL ?? env.MATCHDAY_URL,
    groupId: env.MATCHDAY_GROUP_ID,
    serviceUsername: env.MATCHDAY_SERVICE_USERNAME,
    servicePassword: env.MATCHDAY_SERVICE_PASSWORD,
    userPasswordsJson: env.MATCHDAY_USER_PASSWORDS,
    timeoutMs: env.MATCHDAY_TIMEOUT_MS,
  });
  const portainerClient = createPortainerClient({
    baseUrl: env.PORTAINER_URL,
    apiToken: env.PORTAINER_API_TOKEN,
    endpointId: env.PORTAINER_ENDPOINT_ID,
    timeoutMs: env.PORTAINER_TIMEOUT_MS,
    allowInsecureTls: env.PORTAINER_INSECURE_TLS ?? false,
  });
  const cloudflareClient = createCloudflareClient({
    apiToken: env.CLOUDFLARE_API_TOKEN,
    accountId: env.CLOUDFLARE_ACCOUNT_ID,
    tunnelId: env.CLOUDFLARE_TUNNEL_ID,
    hostnames: env.CLOUDFLARE_CHECK_HOSTNAMES,
    timeoutMs: env.CLOUDFLARE_TIMEOUT_MS,
  });
  const nasClient = createNasClient({
    baseUrl: env.NAS_URL,
    apiToken: env.NAS_API_TOKEN,
    timeoutMs: env.NAS_TIMEOUT_MS,
    allowInsecureTls: env.NAS_INSECURE_TLS ?? true,
  });
  const jellyfinClient = createJellyfinClient({
    baseUrl: env.JELLYFIN_URL,
    publicUrl: env.JELLYFIN_PUBLIC_URL ?? env.JELLYFIN_URL,
    apiKey: env.JELLYFIN_API_KEY,
    userId: env.JELLYFIN_USER_ID,
    timeoutMs: env.JELLYFIN_TIMEOUT_MS,
  });
  const immichClient = createImmichClient({
    photos: {
      baseUrl: env.PHOTOS_URL,
      publicUrl: env.PHOTOS_PUBLIC_URL ?? env.PHOTOS_URL,
      apiKey: env.PHOTOS_API_KEY,
    },
    photosShared: {
      baseUrl: env.PHOTOSSHARED_URL,
      publicUrl: env.PHOTOSSHARED_PUBLIC_URL ?? env.PHOTOSSHARED_URL,
      apiKey: env.PHOTOSSHARED_API_KEY,
    },
    timeoutMs: env.IMMICH_TIMEOUT_MS,
  });
  const assistantService = database.db
    ? createAssistantService({
        repository: createAssistantRepository(database.db),
        tools: createAssistantToolRegistry({
          orionClient,
          matchdayClient,
          jellyfinClient,
          dockerClient,
          portainerClient,
          cloudflareClient,
          nasClient,
          serverMetrics,
        }),
        llmPlanner:
          env.ASSISTANT_LLM_BASE_URL &&
          env.ASSISTANT_LLM_API_KEY &&
          env.ASSISTANT_LLM_MODEL
            ? createLlmPlanner({
                baseUrl: env.ASSISTANT_LLM_BASE_URL,
                apiKey: env.ASSISTANT_LLM_API_KEY,
                model: env.ASSISTANT_LLM_MODEL,
                timeoutMs: env.ASSISTANT_LLM_TIMEOUT_MS,
              })
            : null,
      })
    : null;
  const pushService = database.db
    ? createPushService(database.db, {
        publicKey: env.VAPID_PUBLIC_KEY,
        privateKey: env.VAPID_PRIVATE_KEY,
        subject: env.VAPID_SUBJECT ?? "mailto:admin@martylab.fr",
      })
    : null;
  const pushWorker =
    database.db && pushService && userService
      ? createPushNotificationWorker({
          db: database.db,
          pushService,
          orionClient,
          matchdayClient,
          lookupUser: (userId) => userService.findUserProfile(userId),
          logger,
          intervalMs: env.PUSH_NOTIFICATION_INTERVAL_MS,
        })
      : null;

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(createOriginGuard(env));
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) =>
          req.url === "/api/health" || req.url === "/api/health/live",
      },
    }),
  );
  app.use(createSessionMiddleware(env, sessionService));

  app.use("/api/health", createHealthRouter(database));
  app.use("/api/auth", createAuthRouter(env, sessionService));
  app.use("/api/plugins", requireAuth, pluginsRouter);
  app.use("/api/users", createUsersRouter(userService));
  app.use("/api/system", createSystemRouter(serverMetrics));
  app.use("/api/docker", createDockerRouter(dockerClient));
  app.use("/api/orion", createOrionRouter(orionClient));
  app.use("/api/matchday", createMatchdayRouter(matchdayClient));
  app.use("/api/portainer", createPortainerRouter(portainerClient));
  app.use("/api/cloudflare", createCloudflareRouter(cloudflareClient));
  app.use("/api/nas", createNasRouter(nasClient));
  app.use("/api/jellyfin", createJellyfinRouter(jellyfinClient));
  app.use("/api/immich", createImmichRouter(immichClient));
  app.use("/api/assistant", createAssistantRouter(assistantService));
  app.use("/api/push", createPushRouter(pushService));

  app.use(notFoundHandler);
  app.use(createErrorHandler(logger, env.NODE_ENV === "production"));

  return {
    app,
    startBackgroundJobs() {
      pushWorker?.start();
    },
    stopBackgroundJobs() {
      pushWorker?.stop();
    },
  };
}
