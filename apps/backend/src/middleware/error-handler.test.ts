import { describe, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";
import { AppError } from "../lib/errors.js";
import { createErrorHandler, notFoundHandler } from "./error-handler.js";

function makeApp() {
  const logger = {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  };

  const app = express();
  app.get("/bad-request", () => {
    throw new AppError(400, "invalid_input", "Invalid input.");
  });
  app.get("/boom", () => {
    throw new AppError(500, "boom", "Boom.", { isOperational: false });
  });
  app.use(notFoundHandler);
  app.use(createErrorHandler(logger as never, false));

  return { app, logger };
}

describe("notFoundHandler", () => {
  it("names the method and path in the 404 message", async () => {
    const { app } = makeApp();
    const res = await request(app).get("/api/unknown");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("not_found");
    expect(res.body.error.message).toBe("No route matches GET /api/unknown.");
  });

  it("logs one warn line with method, url and code, without a stack", async () => {
    const { app, logger } = makeApp();
    await request(app).get("/api/unknown");

    expect(logger.warn).toHaveBeenCalledTimes(1);
    const [fields, message] = logger.warn.mock.calls[0] as [
      Record<string, unknown>,
      string,
    ];

    expect(message).toBe("Request failed");
    expect(fields).toMatchObject({
      method: "GET",
      url: "/api/unknown",
      statusCode: 404,
      code: "not_found",
    });
    expect(fields).not.toHaveProperty("err");
  });

  it("keeps the stack for unexpected 5xx errors", async () => {
    const { app, logger } = makeApp();
    const res = await request(app).get("/boom");

    expect(res.status).toBe(500);
    expect(logger.error).toHaveBeenCalledTimes(1);
    const [fields, message] = logger.error.mock.calls[0] as [
      Record<string, unknown>,
      string,
    ];

    expect(message).toBe("Unhandled server error");
    expect(fields).toHaveProperty("err");
    expect(fields).toMatchObject({ method: "GET", url: "/boom" });
  });

  it("does not print a stack for an operational 503", async () => {
    const logger = { error: vi.fn(), warn: vi.fn(), info: vi.fn() };
    const app = express();
    app.get("/metrics", () => {
      throw new AppError(503, "metrics_unavailable", "Requires Linux.");
    });
    app.use(createErrorHandler(logger as never, false));

    const res = await request(app).get("/metrics");

    expect(res.status).toBe(503);
    expect(logger.error).not.toHaveBeenCalled();
    const [fields, message] = logger.warn.mock.calls[0] as [
      Record<string, unknown>,
      string,
    ];
    expect(message).toBe("Request failed");
    expect(fields).toMatchObject({ statusCode: 503, code: "metrics_unavailable" });
    expect(fields).not.toHaveProperty("err");
  });

  it("masks 5xx messages in production but not 4xx", async () => {
    const { app } = makeApp();
    expect((await request(app).get("/bad-request")).body.error.message).toBe(
      "Invalid input.",
    );

    const prod = express();
    prod.get("/boom", () => {
      throw new AppError(500, "boom", "Boom.", { isOperational: false });
    });
    prod.use(
      createErrorHandler({ error: vi.fn(), warn: vi.fn(), info: vi.fn() } as never, true),
    );

    const res = await request(prod).get("/boom");
    expect(res.status).toBe(500);
    expect(res.body.error.message).toBe("An unexpected error occurred.");
  });
});
