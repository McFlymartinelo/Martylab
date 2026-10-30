import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { createOriginGuard } from "./auth.js";
import { createErrorHandler } from "./error-handler.js";

const env = { CORS_ORIGIN: "https://martylab.martylab.fr" } as any;

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use(createOriginGuard(env));
  app.post("/mutate", (_req, res) => res.status(204).send());
  app.get("/read", (_req, res) => res.status(200).send("ok"));
  app.use(createErrorHandler({ error: () => {}, warn: () => {}, info: () => {} } as any, false));
  return app;
}

describe("createOriginGuard", () => {
  it("allows GET without origin", async () => {
    const res = await request(makeApp()).get("/read");
    expect(res.status).toBe(200);
  });

  it("rejects POST without origin", async () => {
    const res = await request(makeApp()).post("/mutate").send({});
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("origin_required");
  });

  it("rejects POST with wrong origin", async () => {
    const res = await request(makeApp())
      .post("/mutate")
      .set("Origin", "https://evil.example")
      .send({});
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("origin_forbidden");
  });

  it("allows POST with correct origin", async () => {
    const res = await request(makeApp())
      .post("/mutate")
      .set("Origin", "https://martylab.martylab.fr")
      .send({});
    expect(res.status).toBe(204);
  });
});