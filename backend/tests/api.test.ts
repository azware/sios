import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    $queryRaw: vi.fn(),
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    student: {
      findMany: vi.fn(),
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

  it("POST /api/auth/register should create user when payload is valid", async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce(null);
    prismaMock.user.create.mockResolvedValueOnce({
      id: 99,
      username: "admin_ci",
      email: "admin_ci@sios.local",
      role: "ADMIN",
    });

    const res = await request(app).post("/api/auth/register").send({
      username: "admin_ci",
      email: "admin_ci@sios.local",
      password: "Admin123!",
      role: "ADMIN",
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(99);
    expect(res.body.username).toBe("admin_ci");
    expect(res.body.role).toBe("ADMIN");
  });

  it("auth flow should allow login then access protected endpoint", async () => {
    const hashed = await bcrypt.hash("Admin123!", 10);
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 101,
      username: "admin_flow",
      email: "admin_flow@sios.local",
      role: "ADMIN",
      password: hashed,
    });

    const loginRes = await request(app).post("/api/auth/login").send({
      username: "admin_flow",
      password: "Admin123!",
    });

    expect(loginRes.status).toBe(200);
    expect(typeof loginRes.body.token).toBe("string");
    expect(loginRes.body.token.length).toBeGreaterThan(10);

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 101,
      username: "admin_flow",
      email: "admin_flow@sios.local",
      role: "ADMIN",
      password: hashed,
    });
    prismaMock.student.findMany.mockResolvedValueOnce([]);

    const protectedRes = await request(app)
      .get("/api/students")
      .set("Authorization", `Bearer ${loginRes.body.token}`);

    expect(protectedRes.status).toBe(200);
    expect(Array.isArray(protectedRes.body)).toBe(true);
  });

  it("GET /api/audit-logs should return 403 for non-admin role", async () => {
    const teacherToken = jwt.sign({ id: 201, role: "TEACHER" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 201,
      username: "teacher_flow",
      email: "teacher_flow@sios.local",
      role: "TEACHER",
      password: "hashed",
    });

    const res = await request(app).get("/api/audit-logs").set("Authorization", `Bearer ${teacherToken}`);
    expect(res.status).toBe(403);
  });

  it("GET /api/users should return 403 for student role", async () => {
    const studentToken = jwt.sign({ id: 301, role: "STUDENT" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 301,
      username: "student_flow",
      email: "student_flow@sios.local",
      role: "STUDENT",
      password: "hashed",
    });

    const res = await request(app).get("/api/users").set("Authorization", `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  it("GET /api/users should return 200 for admin role", async () => {
    const adminToken = jwt.sign({ id: 401, role: "ADMIN" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 401,
      username: "admin_list",
      email: "admin_list@sios.local",
      role: "ADMIN",
      password: "hashed",
    });
    prismaMock.user.findMany = vi.fn().mockResolvedValueOnce([]);

    const res = await request(app).get("/api/users").set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
