import { describe, it, expect } from "vitest";
import request from "supertest";
import "./setup.js";
import { createApp } from "../app.js";

const app = createApp();

describe("POST /api/auth/login", () => {
  it("creates a new user and returns a token", async () => {
    const res = await request(app).post("/api/auth/login").send({ username: "alice" });

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe("alice");
    expect(res.body.token).toBeDefined();
  });

  it("returns the same user on repeat login with a new token", async () => {
    const first = await request(app).post("/api/auth/login").send({ username: "alice" });
    const second = await request(app).post("/api/auth/login").send({ username: "alice" });

    expect(second.body.user.id).toBe(first.body.user.id);
    expect(second.body.token).not.toBe(first.body.token);
  });

  it("returns 400 for invalid username", async () => {
    const res = await request(app).post("/api/auth/login").send({ username: "ab" });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /api/auth/me", () => {
  it("returns the current user with a valid token", async () => {
    const login = await request(app).post("/api/auth/login").send({ username: "alice" });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${login.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe("alice");
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("UNAUTHORIZED");
  });
});

describe("POST /api/auth/logout", () => {
  it("invalidates the session", async () => {
    const login = await request(app).post("/api/auth/login").send({ username: "alice" });
    const token = login.body.token;

    const logoutRes = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${token}`);
    expect(logoutRes.status).toBe(200);

    const meRes = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(meRes.status).toBe(401);
  });
});
