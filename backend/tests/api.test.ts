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
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    teacher: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    class: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    school: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    payment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    attendance: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    schedule: {
      findFirst: vi.fn(),
    },
    parent: {
      findUnique: vi.fn(),
    },
    grade: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      aggregate: vi.fn(),
      count: vi.fn(),
    },
    subject: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({ id: 1 }),
      findMany: vi.fn(),
      count: vi.fn(),
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

  it("GET /api/audit-logs should return pagination for admin role", async () => {
    const adminToken = jwt.sign({ id: 1601, role: "ADMIN" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1601,
      username: "admin_audit",
      email: "admin_audit@sios.local",
      role: "ADMIN",
      password: "hashed",
    });
    prismaMock.auditLog.findMany.mockResolvedValueOnce([
      {
        id: 1,
        method: "POST",
        path: "/api/subjects",
        statusCode: 201,
        createdAt: new Date(),
        user: { id: 1601, username: "admin_audit", role: "ADMIN" },
      },
    ]);
    prismaMock.auditLog.count.mockResolvedValueOnce(1);

    const res = await request(app)
      .get("/api/audit-logs?page=1&pageSize=20&method=POST&path=subjects")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.pagination.page).toBe(1);
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

  it("GET /api/subjects should return 200 for teacher role", async () => {
    const teacherToken = jwt.sign({ id: 901, role: "TEACHER" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 901,
      username: "teacher_subject",
      email: "teacher_subject@sios.local",
      role: "TEACHER",
      password: "hashed",
    });
    prismaMock.subject.findMany.mockResolvedValueOnce([
      { id: 1, code: "MAT101", name: "Matematika", description: "Dasar", teachers: [] },
    ]);

    const res = await request(app).get("/api/subjects").set("Authorization", `Bearer ${teacherToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].code).toBe("MAT101");
  });

  it("POST /api/subjects should return 403 for teacher role", async () => {
    const teacherToken = jwt.sign({ id: 902, role: "TEACHER" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 902,
      username: "teacher_mutation",
      email: "teacher_mutation@sios.local",
      role: "TEACHER",
      password: "hashed",
    });

    const res = await request(app).post("/api/subjects").set("Authorization", `Bearer ${teacherToken}`).send({
      code: "BIO101",
      name: "Biologi",
    });
    expect(res.status).toBe(403);
  });

  it("subjects CRUD should work for admin role", async () => {
    const adminToken = jwt.sign({ id: 903, role: "ADMIN" }, process.env.JWT_SECRET || "secret");

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 903,
      username: "admin_subject_crud",
      email: "admin_subject_crud@sios.local",
      role: "ADMIN",
      password: "hashed",
    });
    prismaMock.subject.create.mockResolvedValueOnce({
      id: 10,
      code: "FIS101",
      name: "Fisika",
      description: "Dasar",
    });
    const createRes = await request(app).post("/api/subjects").set("Authorization", `Bearer ${adminToken}`).send({
      code: "FIS101",
      name: "Fisika",
      description: "Dasar",
    });
    expect(createRes.status).toBe(201);
    expect(createRes.body.id).toBe(10);

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 903,
      username: "admin_subject_crud",
      email: "admin_subject_crud@sios.local",
      role: "ADMIN",
      password: "hashed",
    });
    prismaMock.subject.update.mockResolvedValueOnce({
      id: 10,
      code: "FIS101",
      name: "Fisika Lanjutan",
      description: "Update",
    });
    const updateRes = await request(app).put("/api/subjects/10").set("Authorization", `Bearer ${adminToken}`).send({
      code: "FIS101",
      name: "Fisika Lanjutan",
      description: "Update",
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe("Fisika Lanjutan");

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 903,
      username: "admin_subject_crud",
      email: "admin_subject_crud@sios.local",
      role: "ADMIN",
      password: "hashed",
    });
    prismaMock.subject.delete.mockResolvedValueOnce({ id: 10 });
    const deleteRes = await request(app).delete("/api/subjects/10").set("Authorization", `Bearer ${adminToken}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toContain("berhasil");
  });

  it("GET /api/students should return 200 for teacher role", async () => {
    const teacherToken = jwt.sign({ id: 950, role: "TEACHER" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 950,
      username: "teacher_students",
      email: "teacher_students@sios.local",
      role: "TEACHER",
      password: "hashed",
    });
    prismaMock.student.findMany.mockResolvedValueOnce([]);

    const res = await request(app).get("/api/students").set("Authorization", `Bearer ${teacherToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /api/students should return 403 for student role", async () => {
    const studentToken = jwt.sign({ id: 951, role: "STUDENT" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 951,
      username: "student_forbidden",
      email: "student_forbidden@sios.local",
      role: "STUDENT",
      password: "hashed",
    });

    const res = await request(app).post("/api/students").set("Authorization", `Bearer ${studentToken}`).send({
      nis: "NISX01",
      nisn: "NISNX01",
      name: "Siswa X",
      email: "sx@sios.local",
      classId: 1,
      schoolId: 1,
      userId: 50,
    });
    expect(res.status).toBe(403);
  });

  it("students CRUD should work for admin role", async () => {
    const adminToken = jwt.sign({ id: 952, role: "ADMIN" }, process.env.JWT_SECRET || "secret");

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 952,
      username: "admin_student_crud",
      email: "admin_student_crud@sios.local",
      role: "ADMIN",
      password: "hashed",
    });
    prismaMock.student.create.mockResolvedValueOnce({
      id: 20,
      nis: "NISA01",
      nisn: "NISNA01",
      name: "Siswa A",
      email: "siswaa@sios.local",
    });
    const createRes = await request(app).post("/api/students").set("Authorization", `Bearer ${adminToken}`).send({
      nis: "NISA01",
      nisn: "NISNA01",
      name: "Siswa A",
      email: "siswaa@sios.local",
      classId: 1,
      schoolId: 1,
      userId: 100,
    });
    expect(createRes.status).toBe(201);
    expect(createRes.body.id).toBe(20);

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 952,
      username: "admin_student_crud",
      email: "admin_student_crud@sios.local",
      role: "ADMIN",
      password: "hashed",
    });
    prismaMock.student.update.mockResolvedValueOnce({
      id: 20,
      nis: "NISA01",
      nisn: "NISNA01",
      name: "Siswa A Updated",
      email: "siswaa@sios.local",
    });
    const updateRes = await request(app).put("/api/students/20").set("Authorization", `Bearer ${adminToken}`).send({
      nis: "NISA01",
      nisn: "NISNA01",
      name: "Siswa A Updated",
      email: "siswaa@sios.local",
      classId: 1,
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe("Siswa A Updated");

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 952,
      username: "admin_student_crud",
      email: "admin_student_crud@sios.local",
      role: "ADMIN",
      password: "hashed",
    });
    prismaMock.student.delete.mockResolvedValueOnce({ id: 20 });
    const deleteRes = await request(app).delete("/api/students/20").set("Authorization", `Bearer ${adminToken}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toContain("berhasil");
  });

  it("GET /api/teachers should return 200 for teacher role", async () => {
    const teacherToken = jwt.sign({ id: 980, role: "TEACHER" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 980,
      username: "teacher_list",
      email: "teacher_list@sios.local",
      role: "TEACHER",
      password: "hashed",
    });
    prismaMock.teacher.findMany.mockResolvedValueOnce([]);

    const res = await request(app).get("/api/teachers").set("Authorization", `Bearer ${teacherToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /api/teachers should return 403 for teacher role", async () => {
    const teacherToken = jwt.sign({ id: 981, role: "TEACHER" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 981,
      username: "teacher_forbidden",
      email: "teacher_forbidden@sios.local",
      role: "TEACHER",
      password: "hashed",
    });

    const res = await request(app).post("/api/teachers").set("Authorization", `Bearer ${teacherToken}`).send({
      nip: "NIPX01",
      name: "Guru X",
      email: "gurux@sios.local",
      schoolId: 1,
      userId: 70,
    });
    expect(res.status).toBe(403);
  });

  it("teachers CRUD should work for admin role", async () => {
    const adminToken = jwt.sign({ id: 982, role: "ADMIN" }, process.env.JWT_SECRET || "secret");

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 982,
      username: "admin_teacher_crud",
      email: "admin_teacher_crud@sios.local",
      role: "ADMIN",
      password: "hashed",
    });
    prismaMock.teacher.create.mockResolvedValueOnce({
      id: 30,
      nip: "NIPA01",
      name: "Guru A",
      email: "gurua@sios.local",
    });
    const createRes = await request(app).post("/api/teachers").set("Authorization", `Bearer ${adminToken}`).send({
      nip: "NIPA01",
      name: "Guru A",
      email: "gurua@sios.local",
      schoolId: 1,
      userId: 110,
    });
    expect(createRes.status).toBe(201);
    expect(createRes.body.id).toBe(30);

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 982,
      username: "admin_teacher_crud",
      email: "admin_teacher_crud@sios.local",
      role: "ADMIN",
      password: "hashed",
    });
    prismaMock.teacher.update.mockResolvedValueOnce({
      id: 30,
      nip: "NIPA01",
      name: "Guru A Updated",
      email: "gurua@sios.local",
    });
    const updateRes = await request(app).put("/api/teachers/30").set("Authorization", `Bearer ${adminToken}`).send({
      nip: "NIPA01",
      name: "Guru A Updated",
      email: "gurua@sios.local",
      phone: "08123",
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe("Guru A Updated");

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 982,
      username: "admin_teacher_crud",
      email: "admin_teacher_crud@sios.local",
      role: "ADMIN",
      password: "hashed",
    });
    prismaMock.teacher.delete.mockResolvedValueOnce({ id: 30 });
    const deleteRes = await request(app).delete("/api/teachers/30").set("Authorization", `Bearer ${adminToken}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toContain("berhasil");
  });

  it("GET /api/classes should return 200 for teacher role", async () => {
    const teacherToken = jwt.sign({ id: 990, role: "TEACHER" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 990,
      username: "teacher_classes",
      email: "teacher_classes@sios.local",
      role: "TEACHER",
      password: "hashed",
    });
    prismaMock.class.findMany.mockResolvedValueOnce([]);

    const res = await request(app).get("/api/classes").set("Authorization", `Bearer ${teacherToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /api/classes should return 403 for teacher role", async () => {
    const teacherToken = jwt.sign({ id: 991, role: "TEACHER" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 991,
      username: "teacher_forbidden_class",
      email: "teacher_forbidden_class@sios.local",
      role: "TEACHER",
      password: "hashed",
    });

    const res = await request(app).post("/api/classes").set("Authorization", `Bearer ${teacherToken}`).send({
      name: "10A",
      level: "10",
      schoolId: 1,
    });
    expect(res.status).toBe(403);
  });

  it("POST /api/classes should return 409 for duplicate schoolId+name", async () => {
    const adminToken = jwt.sign({ id: 992, role: "ADMIN" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 992,
      username: "admin_dup_class",
      email: "admin_dup_class@sios.local",
      role: "ADMIN",
      password: "hashed",
    });

    const duplicateError = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "5.0.0",
      meta: { target: ["schoolId", "name"] },
    });
    prismaMock.class.create.mockRejectedValueOnce(duplicateError);

    const res = await request(app).post("/api/classes").set("Authorization", `Bearer ${adminToken}`).send({
      name: "10A",
      level: "10",
      schoolId: 1,
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Data sudah terdaftar");
    expect(res.body.field).toBe("name");
  });

  it("classes CRUD should work for admin role", async () => {
    const adminToken = jwt.sign({ id: 993, role: "ADMIN" }, process.env.JWT_SECRET || "secret");

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 993,
      username: "admin_class_crud",
      email: "admin_class_crud@sios.local",
      role: "ADMIN",
      password: "hashed",
    });
    prismaMock.class.create.mockResolvedValueOnce({
      id: 40,
      name: "11B",
      level: "11",
      schoolId: 1,
    });
    const createRes = await request(app).post("/api/classes").set("Authorization", `Bearer ${adminToken}`).send({
      name: "11B",
      level: "11",
      schoolId: 1,
    });
    expect(createRes.status).toBe(201);
    expect(createRes.body.id).toBe(40);

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 993,
      username: "admin_class_crud",
      email: "admin_class_crud@sios.local",
      role: "ADMIN",
      password: "hashed",
    });
    prismaMock.class.update.mockResolvedValueOnce({
      id: 40,
      name: "11B Updated",
      level: "11",
      schoolId: 1,
    });
    const updateRes = await request(app).put("/api/classes/40").set("Authorization", `Bearer ${adminToken}`).send({
      name: "11B Updated",
      level: "11",
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe("11B Updated");

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 993,
      username: "admin_class_crud",
      email: "admin_class_crud@sios.local",
      role: "ADMIN",
      password: "hashed",
    });
    prismaMock.class.delete.mockResolvedValueOnce({ id: 40 });
    const deleteRes = await request(app).delete("/api/classes/40").set("Authorization", `Bearer ${adminToken}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toContain("berhasil");
  });

  it("GET /api/payments should return 200 for teacher role", async () => {
    const teacherToken = jwt.sign({ id: 1001, role: "TEACHER" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1001,
      username: "teacher_payments",
      email: "teacher_payments@sios.local",
      role: "TEACHER",
      password: "hashed",
    });
    prismaMock.payment.findMany.mockResolvedValueOnce([]);

    const res = await request(app).get("/api/payments").set("Authorization", `Bearer ${teacherToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /api/payments should return 400 for missing required fields", async () => {
    const adminToken = jwt.sign({ id: 1002, role: "ADMIN" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1002,
      username: "admin_payment_missing",
      email: "admin_payment_missing@sios.local",
      role: "ADMIN",
      password: "hashed",
    });

    const res = await request(app).post("/api/payments").set("Authorization", `Bearer ${adminToken}`).send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("tidak lengkap");
  });

  it("payments CRUD should work for admin role", async () => {
    const adminToken = jwt.sign({ id: 1003, role: "ADMIN" }, process.env.JWT_SECRET || "secret");

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1003,
      username: "admin_payment_crud",
      email: "admin_payment_crud@sios.local",
      role: "ADMIN",
      password: "hashed",
    });
    prismaMock.payment.create.mockResolvedValueOnce({
      id: 50,
      studentId: 1,
      amount: 100000,
      description: "SPP Januari",
      dueDate: new Date(),
      status: "PENDING",
    });
    const createRes = await request(app).post("/api/payments").set("Authorization", `Bearer ${adminToken}`).send({
      studentId: 1,
      amount: 100000,
      description: "SPP Januari",
      dueDate: new Date().toISOString(),
    });
    expect(createRes.status).toBe(201);
    expect(createRes.body.id).toBe(50);

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1003,
      username: "admin_payment_crud",
      email: "admin_payment_crud@sios.local",
      role: "ADMIN",
      password: "hashed",
    });
    prismaMock.payment.findUnique.mockResolvedValueOnce({
      id: 50,
      studentId: 1,
      amount: 100000,
      description: "SPP Januari",
      status: "PENDING",
    });
    prismaMock.payment.update.mockResolvedValueOnce({
      id: 50,
      studentId: 1,
      amount: 100000,
      description: "SPP Januari",
      status: "PAID",
      paidAt: new Date(),
    });
    const updateRes = await request(app).put("/api/payments/50").set("Authorization", `Bearer ${adminToken}`).send({
      status: "PAID",
      paidAt: new Date().toISOString(),
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.status).toBe("PAID");

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1003,
      username: "admin_payment_crud",
      email: "admin_payment_crud@sios.local",
      role: "ADMIN",
      password: "hashed",
    });
    prismaMock.payment.delete.mockResolvedValueOnce({ id: 50 });
    const deleteRes = await request(app).delete("/api/payments/50").set("Authorization", `Bearer ${adminToken}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toContain("berhasil");
  });

  it("GET /api/grades should return 200 for teacher role", async () => {
    const teacherToken = jwt.sign({ id: 1101, role: "TEACHER" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1101,
      username: "teacher_grades",
      email: "teacher_grades@sios.local",
      role: "TEACHER",
      password: "hashed",
    });
    prismaMock.grade.findMany.mockResolvedValueOnce([]);

    const res = await request(app).get("/api/grades").set("Authorization", `Bearer ${teacherToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /api/grades should return 400 for missing required fields", async () => {
    const adminToken = jwt.sign({ id: 1102, role: "ADMIN" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1102,
      username: "admin_grade_missing",
      email: "admin_grade_missing@sios.local",
      role: "ADMIN",
      password: "hashed",
    });

    const res = await request(app).post("/api/grades").set("Authorization", `Bearer ${adminToken}`).send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("tidak lengkap");
  });

  it("POST /api/grades should return 403 when teacher not assigned to subject", async () => {
    const teacherToken = jwt.sign({ id: 1103, role: "TEACHER" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1103,
      username: "teacher_not_assigned",
      email: "teacher_not_assigned@sios.local",
      role: "TEACHER",
      password: "hashed",
    });
    prismaMock.teacher.findUnique.mockResolvedValueOnce({
      id: 220,
      userId: 1103,
    });
    prismaMock.teacher.findFirst.mockResolvedValueOnce(null);

    const res = await request(app).post("/api/grades").set("Authorization", `Bearer ${teacherToken}`).send({
      studentId: 1,
      subjectId: 2,
      teacherId: 220,
      score: 80,
      term: "1",
      academicYear: "2025/2026",
    });
    expect(res.status).toBe(403);
  });

  it("grades CRUD should work for admin role", async () => {
    const adminToken = jwt.sign({ id: 1104, role: "ADMIN" }, process.env.JWT_SECRET || "secret");

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1104,
      username: "admin_grade_crud",
      email: "admin_grade_crud@sios.local",
      role: "ADMIN",
      password: "hashed",
    });
    prismaMock.grade.findUnique.mockResolvedValueOnce(null);
    prismaMock.grade.create.mockResolvedValueOnce({
      id: 60,
      studentId: 1,
      subjectId: 2,
      teacherId: 3,
      score: 88,
      term: "1",
      academicYear: "2025/2026",
    });
    const createRes = await request(app).post("/api/grades").set("Authorization", `Bearer ${adminToken}`).send({
      studentId: 1,
      subjectId: 2,
      teacherId: 3,
      score: 88,
      term: "1",
      academicYear: "2025/2026",
    });
    expect(createRes.status).toBe(201);
    expect(createRes.body.id).toBe(60);

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1104,
      username: "admin_grade_crud",
      email: "admin_grade_crud@sios.local",
      role: "ADMIN",
      password: "hashed",
    });
    prismaMock.grade.findUnique.mockResolvedValueOnce({
      id: 60,
      studentId: 1,
      subjectId: 2,
      teacherId: 3,
      score: 88,
      term: "1",
      academicYear: "2025/2026",
    });
    prismaMock.grade.update.mockResolvedValueOnce({
      id: 60,
      studentId: 1,
      subjectId: 2,
      teacherId: 3,
      score: 90,
      term: "1",
      academicYear: "2025/2026",
    });
    const updateRes = await request(app).put("/api/grades/60").set("Authorization", `Bearer ${adminToken}`).send({
      score: 90,
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.score).toBe(90);

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1104,
      username: "admin_grade_crud",
      email: "admin_grade_crud@sios.local",
      role: "ADMIN",
      password: "hashed",
    });
    prismaMock.grade.findUnique.mockResolvedValueOnce({
      id: 60,
      studentId: 1,
      subjectId: 2,
      teacherId: 3,
      score: 90,
      term: "1",
      academicYear: "2025/2026",
    });
    prismaMock.grade.delete.mockResolvedValueOnce({ id: 60 });
    const deleteRes = await request(app).delete("/api/grades/60").set("Authorization", `Bearer ${adminToken}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toContain("berhasil");
  });

  it("GET /api/attendance should return 200 for teacher role", async () => {
    const teacherToken = jwt.sign({ id: 1201, role: "TEACHER" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1201,
      username: "teacher_attendance",
      email: "teacher_attendance@sios.local",
      role: "TEACHER",
      password: "hashed",
    });
    prismaMock.attendance.findMany.mockResolvedValueOnce([]);

    const res = await request(app).get("/api/attendance").set("Authorization", `Bearer ${teacherToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /api/attendance should return 400 for missing required fields", async () => {
    const adminToken = jwt.sign({ id: 1202, role: "ADMIN" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1202,
      username: "admin_attendance_missing",
      email: "admin_attendance_missing@sios.local",
      role: "ADMIN",
      password: "hashed",
    });

    const res = await request(app).post("/api/attendance").set("Authorization", `Bearer ${adminToken}`).send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("tidak lengkap");
  });

  it("POST /api/attendance should return 403 when teacher not assigned to class", async () => {
    const teacherToken = jwt.sign({ id: 1203, role: "TEACHER" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1203,
      username: "teacher_not_assigned_att",
      email: "teacher_not_assigned_att@sios.local",
      role: "TEACHER",
      password: "hashed",
    });
    prismaMock.teacher.findUnique.mockResolvedValueOnce({
      id: 330,
      userId: 1203,
    });
    prismaMock.student.findUnique.mockResolvedValueOnce({
      id: 10,
      userId: 500,
      classId: 99,
    });
    prismaMock.schedule.findFirst.mockResolvedValueOnce(null);

    const res = await request(app).post("/api/attendance").set("Authorization", `Bearer ${teacherToken}`).send({
      studentId: 10,
      date: new Date().toISOString(),
      status: "PRESENT",
    });
    expect(res.status).toBe(403);
  });

  it("attendance CRUD should work for admin role", async () => {
    const adminToken = jwt.sign({ id: 1204, role: "ADMIN" }, process.env.JWT_SECRET || "secret");

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1204,
      username: "admin_attendance_crud",
      email: "admin_attendance_crud@sios.local",
      role: "ADMIN",
      password: "hashed",
    });
    prismaMock.attendance.create.mockResolvedValueOnce({
      id: 70,
      studentId: 10,
      date: new Date(),
      status: "PRESENT",
    });
    const createRes = await request(app).post("/api/attendance").set("Authorization", `Bearer ${adminToken}`).send({
      studentId: 10,
      date: new Date().toISOString(),
      status: "PRESENT",
    });
    expect(createRes.status).toBe(201);
    expect(createRes.body.id).toBe(70);

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1204,
      username: "admin_attendance_crud",
      email: "admin_attendance_crud@sios.local",
      role: "ADMIN",
      password: "hashed",
    });
    prismaMock.attendance.update.mockResolvedValueOnce({
      id: 70,
      studentId: 10,
      date: new Date(),
      status: "LATE",
    });
    const updateRes = await request(app).put("/api/attendance/70").set("Authorization", `Bearer ${adminToken}`).send({
      status: "LATE",
      note: "Terlambat",
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.status).toBe("LATE");

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1204,
      username: "admin_attendance_crud",
      email: "admin_attendance_crud@sios.local",
      role: "ADMIN",
      password: "hashed",
    });
    prismaMock.attendance.delete.mockResolvedValueOnce({ id: 70 });
    const deleteRes = await request(app).delete("/api/attendance/70").set("Authorization", `Bearer ${adminToken}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toContain("berhasil");
  });

  it("GET /api/dashboard/kpis should return admin aggregates", async () => {
    const adminToken = jwt.sign({ id: 1301, role: "ADMIN" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1301,
      username: "admin_kpi",
      email: "admin_kpi@sios.local",
      role: "ADMIN",
      password: "hashed",
    });
    prismaMock.student.count.mockResolvedValueOnce(10);
    prismaMock.teacher.count.mockResolvedValueOnce(5);
    prismaMock.class.count.mockResolvedValueOnce(3);
    prismaMock.payment.count.mockResolvedValueOnce(7);
    prismaMock.attendance.count.mockResolvedValueOnce(4);
    prismaMock.attendance.count.mockResolvedValueOnce(3);
    prismaMock.payment.count.mockResolvedValueOnce(2);
    prismaMock.grade.aggregate.mockResolvedValueOnce({ _avg: { score: 88.5 } });

    const res = await request(app).get("/api/dashboard/kpis").set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.totalStudents).toBe(10);
    expect(res.body.totalTeachers).toBe(5);
    expect(res.body.totalClasses).toBe(3);
    expect(res.body.totalPayments).toBe(7);
    expect(res.body.attendanceRateToday).toBeCloseTo(75, 5);
    expect(res.body.overduePayments).toBe(2);
    expect(res.body.averageGrade).toBe(88.5);
  });

  it("GET /api/notifications should return items for admin", async () => {
    const adminToken = jwt.sign({ id: 1302, role: "ADMIN" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1302,
      username: "admin_notif",
      email: "admin_notif@sios.local",
      role: "ADMIN",
      password: "hashed",
    });
    prismaMock.payment.count.mockResolvedValueOnce(2);
    prismaMock.attendance.count.mockResolvedValueOnce(1);
    prismaMock.grade.count.mockResolvedValueOnce(3);

    const res = await request(app).get("/api/notifications").set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBe(3);
  });

  it("GET /api/dashboard/kpis should scope to student when role is STUDENT", async () => {
    const studentToken = jwt.sign({ id: 1303, role: "STUDENT" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1303,
      username: "student_kpi",
      email: "student_kpi@sios.local",
      role: "STUDENT",
      password: "hashed",
    });
    prismaMock.student.findUnique.mockResolvedValueOnce({ id: 77, userId: 1303 });
    prismaMock.attendance.count.mockResolvedValueOnce(1);
    prismaMock.attendance.count.mockResolvedValueOnce(1);
    prismaMock.payment.count.mockResolvedValueOnce(5);
    prismaMock.payment.count.mockResolvedValueOnce(1);
    prismaMock.grade.aggregate.mockResolvedValueOnce({ _avg: { score: 90 } });

    const res = await request(app).get("/api/dashboard/kpis").set("Authorization", `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.totalStudents).toBe(1);
    expect(res.body.totalPayments).toBe(5);
    expect(res.body.overduePayments).toBe(1);
    expect(res.body.averageGrade).toBe(90);
  });

  it("GET /api/dashboard/kpis should scope to parent when role is PARENT", async () => {
    const parentToken = jwt.sign({ id: 1501, role: "PARENT" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1501,
      username: "parent_kpi",
      email: "parent_kpi@sios.local",
      role: "PARENT",
      password: "hashed",
    });
    prismaMock.parent.findUnique.mockResolvedValueOnce({
      students: [{ id: 10 }, { id: 11 }],
    });
    prismaMock.attendance.count.mockResolvedValueOnce(2);
    prismaMock.attendance.count.mockResolvedValueOnce(1);
    prismaMock.payment.count.mockResolvedValueOnce(4);
    prismaMock.payment.count.mockResolvedValueOnce(1);
    prismaMock.grade.aggregate.mockResolvedValueOnce({ _avg: { score: 82 } });

    const res = await request(app).get("/api/dashboard/kpis").set("Authorization", `Bearer ${parentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.totalStudents).toBe(2);
    expect(res.body.totalPayments).toBe(4);
    expect(res.body.overduePayments).toBe(1);
    expect(res.body.averageGrade).toBe(82);
  });

  it("GET /api/notifications should scope to parent when role is PARENT", async () => {
    const parentToken = jwt.sign({ id: 1502, role: "PARENT" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1502,
      username: "parent_notif",
      email: "parent_notif@sios.local",
      role: "PARENT",
      password: "hashed",
    });
    prismaMock.parent.findUnique.mockResolvedValueOnce({
      students: [{ id: 10 }],
    });
    prismaMock.payment.count.mockResolvedValueOnce(1);
    prismaMock.attendance.count.mockResolvedValueOnce(0);
    prismaMock.grade.count.mockResolvedValueOnce(0);

    const res = await request(app).get("/api/notifications").set("Authorization", `Bearer ${parentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items[0].type).toBe("PAYMENT_OVERDUE");
  });

  it("GET /api/payments/student/:id should allow student to view own payments", async () => {
    const studentToken = jwt.sign({ id: 1401, role: "STUDENT" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1401,
      username: "student_payments",
      email: "student_payments@sios.local",
      role: "STUDENT",
      password: "hashed",
    });
    prismaMock.student.findUnique.mockResolvedValueOnce({
      id: 55,
      userId: 1401,
    });
    prismaMock.payment.findMany.mockResolvedValueOnce([]);

    const res = await request(app).get("/api/payments/student/55").set("Authorization", `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/payments/student/:id should forbid student access to other student", async () => {
    const studentToken = jwt.sign({ id: 1402, role: "STUDENT" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1402,
      username: "student_payments_forbidden",
      email: "student_payments_forbidden@sios.local",
      role: "STUDENT",
      password: "hashed",
    });
    prismaMock.student.findUnique.mockResolvedValueOnce({
      id: 56,
      userId: 9999,
    });

    const res = await request(app).get("/api/payments/student/56").set("Authorization", `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  it("GET /api/attendance/student/:id should allow student to view own attendance", async () => {
    const studentToken = jwt.sign({ id: 1403, role: "STUDENT" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1403,
      username: "student_attendance",
      email: "student_attendance@sios.local",
      role: "STUDENT",
      password: "hashed",
    });
    prismaMock.student.findUnique.mockResolvedValueOnce({
      id: 60,
      userId: 1403,
    });
    prismaMock.attendance.findMany.mockResolvedValueOnce([]);

    const res = await request(app).get("/api/attendance/student/60").set("Authorization", `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/attendance/student/:id should forbid student access to other student", async () => {
    const studentToken = jwt.sign({ id: 1404, role: "STUDENT" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1404,
      username: "student_attendance_forbidden",
      email: "student_attendance_forbidden@sios.local",
      role: "STUDENT",
      password: "hashed",
    });
    prismaMock.student.findUnique.mockResolvedValueOnce({
      id: 61,
      userId: 9999,
    });

    const res = await request(app).get("/api/attendance/student/61").set("Authorization", `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  it("GET /api/payments/student/:id should allow parent to view child payments", async () => {
    const parentToken = jwt.sign({ id: 1701, role: "PARENT" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1701,
      username: "parent_payments",
      email: "parent_payments@sios.local",
      role: "PARENT",
      password: "hashed",
    });
    prismaMock.parent.findUnique.mockResolvedValueOnce({
      students: [{ id: 70 }],
    });
    prismaMock.payment.findMany.mockResolvedValueOnce([]);

    const res = await request(app).get("/api/payments/student/70").set("Authorization", `Bearer ${parentToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/payments/student/:id should forbid parent access to non-child", async () => {
    const parentToken = jwt.sign({ id: 1702, role: "PARENT" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1702,
      username: "parent_payments_forbidden",
      email: "parent_payments_forbidden@sios.local",
      role: "PARENT",
      password: "hashed",
    });
    prismaMock.parent.findUnique.mockResolvedValueOnce({
      students: [{ id: 71 }],
    });

    const res = await request(app).get("/api/payments/student/72").set("Authorization", `Bearer ${parentToken}`);
    expect(res.status).toBe(403);
  });

  it("GET /api/attendance/student/:id should allow parent to view child attendance", async () => {
    const parentToken = jwt.sign({ id: 1703, role: "PARENT" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1703,
      username: "parent_attendance",
      email: "parent_attendance@sios.local",
      role: "PARENT",
      password: "hashed",
    });
    prismaMock.parent.findUnique.mockResolvedValueOnce({
      students: [{ id: 73 }],
    });
    prismaMock.attendance.findMany.mockResolvedValueOnce([]);

    const res = await request(app).get("/api/attendance/student/73").set("Authorization", `Bearer ${parentToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/attendance/student/:id should forbid parent access to non-child", async () => {
    const parentToken = jwt.sign({ id: 1704, role: "PARENT" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1704,
      username: "parent_attendance_forbidden",
      email: "parent_attendance_forbidden@sios.local",
      role: "PARENT",
      password: "hashed",
    });
    prismaMock.parent.findUnique.mockResolvedValueOnce({
      students: [{ id: 74 }],
    });

    const res = await request(app).get("/api/attendance/student/75").set("Authorization", `Bearer ${parentToken}`);
    expect(res.status).toBe(403);
  });

  it("GET /api/schools should return 200 for admin", async () => {
    const adminToken = jwt.sign({ id: 1801, role: "ADMIN" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1801,
      username: "admin_schools",
      email: "admin_schools@sios.local",
      role: "ADMIN",
      password: "hashed",
    });
    prismaMock.school.findMany.mockResolvedValueOnce([{ id: 1, name: "Sekolah A" }]);

    const res = await request(app).get("/api/schools").set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].name).toBe("Sekolah A");
  });

  it("POST /api/schools should validate required fields", async () => {
    const adminToken = jwt.sign({ id: 1802, role: "ADMIN" }, process.env.JWT_SECRET || "secret");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1802,
      username: "admin_school_missing",
      email: "admin_school_missing@sios.local",
      role: "ADMIN",
      password: "hashed",
    });

    const res = await request(app).post("/api/schools").set("Authorization", `Bearer ${adminToken}`).send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Nama sekolah");
  });

  it("schools CRUD should work for admin role", async () => {
    const adminToken = jwt.sign({ id: 1803, role: "ADMIN" }, process.env.JWT_SECRET || "secret");

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1803,
      username: "admin_school_crud",
      email: "admin_school_crud@sios.local",
      role: "ADMIN",
      password: "hashed",
    });
    prismaMock.school.create.mockResolvedValueOnce({
      id: 90,
      name: "Sekolah Baru",
      email: "sekolah@sios.local",
    });
    const createRes = await request(app).post("/api/schools").set("Authorization", `Bearer ${adminToken}`).send({
      name: "Sekolah Baru",
      email: "sekolah@sios.local",
    });
    expect(createRes.status).toBe(201);
    expect(createRes.body.id).toBe(90);

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1803,
      username: "admin_school_crud",
      email: "admin_school_crud@sios.local",
      role: "ADMIN",
      password: "hashed",
    });
    prismaMock.school.update.mockResolvedValueOnce({
      id: 90,
      name: "Sekolah Baru Updated",
      email: "sekolah@sios.local",
    });
    const updateRes = await request(app).put("/api/schools/90").set("Authorization", `Bearer ${adminToken}`).send({
      name: "Sekolah Baru Updated",
      email: "sekolah@sios.local",
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe("Sekolah Baru Updated");

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1803,
      username: "admin_school_crud",
      email: "admin_school_crud@sios.local",
      role: "ADMIN",
      password: "hashed",
    });
    prismaMock.school.delete.mockResolvedValueOnce({ id: 90 });
    const deleteRes = await request(app).delete("/api/schools/90").set("Authorization", `Bearer ${adminToken}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toContain("berhasil");
  });
});
