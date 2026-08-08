import { Router } from "express";
import type { DockerContainersResponse } from "@martylab/shared";
import type { DockerClient } from "../connectors/docker/docker-client.js";
import { AppError } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";

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

  return dockerRouter;
}
