import type { ApiError } from "@martylab/shared";

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

async function parseError(response: Response): Promise<ApiClientError> {
  try {
    const body = (await response.json()) as ApiError;
    return new ApiClientError(
      response.status,
      body.error.code,
      body.error.message,
    );
  } catch {
    return new ApiClientError(
      response.status,
      "unknown_error",
      response.statusText || "Unexpected API error",
    );
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as T;
}
