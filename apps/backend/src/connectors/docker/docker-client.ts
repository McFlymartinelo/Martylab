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

function dockerRequest<T>(
  socketPath: string,
  apiPath: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        socketPath,
        path: apiPath,
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          if ((response.statusCode ?? 500) >= 400) {
            reject(
              new Error(
                `Docker API error ${response.statusCode ?? "unknown"}: ${body}`,
              ),
            );
            return;
          }

          try {
            resolve(JSON.parse(body) as T);
          } catch (error) {
            reject(error);
          }
        });
      },
    );

    request.on("error", reject);
    request.end();
  });
}

export function createDockerClient(socketPath: string | undefined) {
  const isConfigured = Boolean(socketPath);

  return {
    isConfigured,
    async listContainers(): Promise<DockerContainerSummary[]> {
      if (!socketPath) {
        return [];
      }

      const rows = await dockerRequest<DockerContainerApiRow[]>(
        socketPath,
        "/containers/json?all=true",
      );

      return rows.map((row) => ({
        id: row.Id.slice(0, 12),
        name: (row.Names[0] ?? "unknown").replace(/^\//, ""),
        image: row.Image,
        state: row.State,
        status: row.Status,
      }));
    },
  };
}

export type DockerClient = ReturnType<typeof createDockerClient>;
