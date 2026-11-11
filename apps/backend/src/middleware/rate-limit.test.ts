import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { createAuthRateLimiter } from "./rate-limit.js";

function makeApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use("/api/auth/login", createAuthRateLimiter());
  app.post("/api/auth/login", (_req, res) => res.status(204).send());
  app.get("/api/auth/me", (_req, res) => res.status(200).json({ ok: true }));
  return app;
}

describe("createAuthRateLimiter", () => {
  it("blocks the 11th login attempt from the same IP", async () => {
    const app = makeApp();

    for (let attempt = 1; attempt <= 10; attempt += 1) {
      const res = await request(app)
        .post("/api/auth/login")
        .set("Origin", "https://martylab.martylab.fr")
        .send({ username: "alexandre", password: "wrong" });
      expect(res.status).toBe(204);
    }

    const blocked = await request(app)
      .post("/api/auth/login")
      .set("Origin", "https://martylab.martylab.fr")
      .send({ username: "alexandre", password: "wrong" });

    expect(blocked.status).toBe(429);
  });

  it("does not throttle the session read route", async () => {
    const app = makeApp();

    for (let attempt = 1; attempt <= 15; attempt += 1) {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(200);
    }
  });
});
