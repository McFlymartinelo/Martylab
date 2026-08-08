import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import type {
  DockerContainerLogsResponse,
  DockerContainersResponse,
} from "@martylab/shared";
import type { DockerClient } from "../connectors/docker/docker-client.js";
import { AppError } from "../lib/errors.js";
import { requireAuth, requireMinRole } from "../middleware/auth.js";

const logsQuerySchema = z.object({
  tail: z.coerce.number().int().min(10).max(500).optional(),
});

function parseContainerId(raw: string | string[] | undefined): string {
  if (typeof raw !== "string" || raw.length === 0) {
    throw new AppError(400, "invalid_container_id", "Invalid container id.");
  }
  return raw;
}

export function createDockerRouter(dockerClient: DockerClient) {
  const dockerRouter = Router();

  dockerRouter.get("/containers", requireAuth, async (_req, res, next) => {
    try {
      if (!dockerClient.isConfigured) {
        const body: DockerContainersResponse = {
          available: false,
          containers: [],
        };
        res.status(200).json(body);
        return;
      }

      const containers = await dockerClient.listContainers();
      const body: DockerContainersResponse = {
        available: true,
        containers,
      };
      res.status(200).json(body);
    } catch (error) {
      next(
        new AppError(
          503,
          "docker_unavailable",
          "Unable to reach the Docker API.",
          { cause: error },
        ),
      );
    }
  });

  dockerRouter.get(
    "/containers/:containerId/logs",
    requireAuth,
    async (req, res, next) => {
      try {
        if (!dockerClient.isConfigured) {
          throw new AppError(
            503,
            "docker_unavailable",
            "Docker connector is not configured.",
          );
        }

        const containerId = parseContainerId(req.params.containerId);
        const parsed = logsQuerySchema.safeParse(req.query);
        if (!parsed.success) {
          throw new AppError(400, "invalid_query", "Invalid logs query.");
        }

        const logs = await dockerClient.getContainerLogs(
          containerId,
          parsed.data.tail ?? 100,
        );
        const body: DockerContainerLogsResponse = { logs };
        res.status(200).json(body);
      } catch (error) {
        if (error instanceof AppError) {
          next(error);
          return;
        }
        next(
          new AppError(
            503,
            "docker_unavailable",
            "Unable to fetch container logs.",
            { cause: error },
          ),
        );
      }
    },
  );

  async function runAction(
    req: Request,
    res: Response,
    next: NextFunction,
    action: "start" | "stop" | "restart",
  ) {
    try {
      if (!dockerClient.isConfigured) {
        throw new AppError(
          503,
          "docker_unavailable",
          "Docker connector is not configured.",
        );
      }

      const containerId = parseContainerId(req.params.containerId);

      if (action === "start") {
        await dockerClient.startContainer(containerId);
      } else if (action === "stop") {
        await dockerClient.stopContainer(containerId);
      } else {
        await dockerClient.restartContainer(containerId);
      }

      res.status(204).send();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
        return;
      }
      next(
        new AppError(
          503,
          "docker_action_failed",
          `Unable to ${action} container.`,
          { cause: error },
        ),
      );
    }
  }

  dockerRouter.post(
    "/containers/:containerId/start",
    requireAuth,
    requireMinRole("user"),
    (req, res, next) => {
      void runAction(req, res, next, "start");
    },
  );
  dockerRouter.post(
    "/containers/:containerId/stop",
    requireAuth,
    requireMinRole("user"),
    (req, res, next) => {
      void runAction(req, res, next, "stop");
    },
  );
  dockerRouter.post(
    "/containers/:containerId/restart",
    requireAuth,
    requireMinRole("user"),
    (req, res, next) => {
      void runAction(req, res, next, "restart");
    },
  );

  return dockerRouter;
}
