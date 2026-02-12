import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    $queryRaw: vi.fn(),
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("../src/prisma", () => ({
  default: prismaMock,
}));

import app from "../src/app";

describe("API baseline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/health should return ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("GET /api/health/ready should return ready when db is up", async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([{ ok: 1 }]);
    const res = await request(app).get("/api/health/ready");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ready", db: "up" });
  });

  it("GET /api/health/ready should return 503 when db is down", async () => {
    prismaMock.$queryRaw.mockRejectedValueOnce(new Error("db down"));
    const res = await request(app).get("/api/health/ready");
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: "not_ready", db: "down" });
  });

  it("POST /api/auth/register should validate required fields", async () => {
    const res = await request(app).post("/api/auth/register").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("username");
  });

  it("POST /api/auth/login should validate required fields", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("username");
  });

  it("GET /api/notifications should require auth", async () => {
    const res = await request(app).get("/api/notifications");
    expect(res.status).toBe(401);
  });
});
