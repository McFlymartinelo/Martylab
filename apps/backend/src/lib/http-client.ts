import { Agent, fetch as undiciFetch } from "undici";

export interface FetchJsonOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  allowInsecureTls?: boolean;
}

const insecureAgent = new Agent({
  connect: {
    rejectUnauthorized: false,
  },
});

export async function fetchJson<T>(
  url: string,
  options: FetchJsonOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 6_000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...options.headers,
    };

    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    if (options.allowInsecureTls) {
      const response = await undiciFetch(url, {
        method: options.method ?? "GET",
        headers,
        signal: controller.signal,
        ...(options.body !== undefined
          ? { body: JSON.stringify(options.body) }
          : {}),
        dispatcher: insecureAgent,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(
          `HTTP ${response.status}${text ? `: ${text.slice(0, 200)}` : ""}`,
        );
      }

      return (await response.json()) as T;
    }

    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      signal: controller.signal,
      ...(options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `HTTP ${response.status}${text ? `: ${text.slice(0, 200)}` : ""}`,
      );
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}
