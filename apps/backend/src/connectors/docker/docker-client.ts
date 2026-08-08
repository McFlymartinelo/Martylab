import http from "node:http";

export interface DockerContainerSummary {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
}

interface DockerContainerApiRow {
  Id: string;
  Names: string[];
  Image: string;
  State: string;
  Status: string;
}

function dockerRequest(
  socketPath: string,
  apiPath: string,
  method: "GET" | "POST" = "GET",
): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        socketPath,
        path: apiPath,
        method,
        headers: {
          Accept: method === "GET" ? "application/json" : "*/*",
        },
      },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          resolve({
            statusCode: response.statusCode ?? 500,
            body,
          });
        });
      },
    );

    request.on("error", reject);
    request.end();
  });
}

function assertDockerSuccess(statusCode: number, body: string) {
  if (statusCode >= 400) {
    throw new Error(`Docker API error ${statusCode}: ${body}`);
  }
}

export function createDockerClient(socketPath: string | undefined) {
  const isConfigured = Boolean(socketPath);

  return {
    isConfigured,
    async listContainers(): Promise<DockerContainerSummary[]> {
      if (!socketPath) {
        return [];
      }

      const { statusCode, body } = await dockerRequest(
        socketPath,
        "/containers/json?all=true",
      );
      assertDockerSuccess(statusCode, body);

      const rows = JSON.parse(body) as DockerContainerApiRow[];
      return rows.map((row) => ({
        id: row.Id.slice(0, 12),
        name: (row.Names[0] ?? "unknown").replace(/^\//, ""),
        image: row.Image,
        state: row.State,
        status: row.Status,
      }));
    },

    async startContainer(containerId: string): Promise<void> {
      if (!socketPath) {
        throw new Error("Docker socket is not configured.");
      }

      const { statusCode, body } = await dockerRequest(
        socketPath,
        `/containers/${containerId}/start`,
        "POST",
      );
      assertDockerSuccess(statusCode, body);
    },

    async stopContainer(containerId: string): Promise<void> {
      if (!socketPath) {
        throw new Error("Docker socket is not configured.");
      }

      const { statusCode, body } = await dockerRequest(
        socketPath,
        `/containers/${containerId}/stop`,
        "POST",
      );
      assertDockerSuccess(statusCode, body);
    },

    async restartContainer(containerId: string): Promise<void> {
      if (!socketPath) {
        throw new Error("Docker socket is not configured.");
      }

      const { statusCode, body } = await dockerRequest(
        socketPath,
        `/containers/${containerId}/restart`,
        "POST",
      );
      assertDockerSuccess(statusCode, body);
    },

    async getContainerLogs(
      containerId: string,
      tail = 100,
    ): Promise<string> {
      if (!socketPath) {
        throw new Error("Docker socket is not configured.");
      }

      const { statusCode, body } = await dockerRequest(
        socketPath,
        `/containers/${containerId}/logs?stdout=true&stderr=true&tail=${tail}&timestamps=true`,
      );
      assertDockerSuccess(statusCode, body);
      return body;
    },
  };
}

export type DockerClient = ReturnType<typeof createDockerClient>;
