import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";
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
      create: vi.fn(),
    },
    teacher: {
      create: vi.fn(),
    },
    subject: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({ id: 1 }),
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

  it("GET /api/students should return 401 for malformed token", async () => {
    const res = await request(app).get("/api/students").set("Authorization", "Bearer invalid.token.value");
    expect(res.status).toBe(401);
  });

  it("GET /api/students should return 401 for expired token", async () => {
    const expiredToken = jwt.sign(
      { id: 999, role: "ADMIN", exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_SECRET || "secret"
    );
    const res = await request(app).get("/api/students").set("Authorization", `Bearer ${expiredToken}`);
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

  it("POST /api/auth/register should reject duplicate username/email", async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce({
      id: 77,
      username: "dup_user",
      email: "dup@sios.local",
      role: "ADMIN",
      password: "hashed",
    });

    const res = await request(app).post("/api/auth/register").send({
      username: "dup_user",
      email: "dup@sios.local",
      password: "Admin123!",
      role: "ADMIN",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("sudah terdaftar");
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

  it("POST /api/subjects should validate required fields", async () => {
    const adminToken = jwt.sign({ id: 501, role: "ADMIN" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 501,
      username: "admin_subject",
      email: "admin_subject@sios.local",
      role: "ADMIN",
      password: "hashed",
    });

    const res = await request(app).post("/api/subjects").set("Authorization", `Bearer ${adminToken}`).send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Kode dan nama");
  });

  it("POST /api/subjects should return 409 for duplicate subject code", async () => {
    const adminToken = jwt.sign({ id: 601, role: "ADMIN" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 601,
      username: "admin_dup_subject",
      email: "admin_dup_subject@sios.local",
      role: "ADMIN",
      password: "hashed",
    });

    const duplicateError = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      {
        code: "P2002",
        clientVersion: "5.0.0",
        meta: { target: ["code"] },
      }
    );
    prismaMock.subject.create.mockRejectedValueOnce(duplicateError);

    const res = await request(app).post("/api/subjects").set("Authorization", `Bearer ${adminToken}`).send({
      code: "MAT101",
      name: "Matematika",
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Data sudah terdaftar");
    expect(res.body.field).toBe("code");
  });

  it("POST /api/students should return 409 for duplicate nis", async () => {
    const adminToken = jwt.sign({ id: 701, role: "ADMIN" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 701,
      username: "admin_dup_student",
      email: "admin_dup_student@sios.local",
      role: "ADMIN",
      password: "hashed",
    });

    const duplicateError = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "5.0.0",
      meta: { target: ["nis"] },
    });
    prismaMock.student.create.mockRejectedValueOnce(duplicateError);

    const res = await request(app).post("/api/students").set("Authorization", `Bearer ${adminToken}`).send({
      nis: "NIS001",
      nisn: "NISN001",
      name: "Siswa Uji",
      email: "siswa_uji@sios.local",
      classId: 1,
      schoolId: 1,
      userId: 10,
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Data sudah terdaftar");
    expect(res.body.field).toBe("nis");
  });

  it("POST /api/teachers should return 409 for duplicate nip", async () => {
    const adminToken = jwt.sign({ id: 801, role: "ADMIN" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 801,
      username: "admin_dup_teacher",
      email: "admin_dup_teacher@sios.local",
      role: "ADMIN",
      password: "hashed",
    });

    const duplicateError = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "5.0.0",
      meta: { target: ["nip"] },
    });
    prismaMock.teacher.create.mockRejectedValueOnce(duplicateError);

    const res = await request(app).post("/api/teachers").set("Authorization", `Bearer ${adminToken}`).send({
      nip: "NIP001",
      name: "Guru Uji",
      email: "guru_uji@sios.local",
      schoolId: 1,
      userId: 11,
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Data sudah terdaftar");
    expect(res.body.field).toBe("nip");
  });
});
