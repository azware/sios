import { Router } from "express";
import prisma from "../prisma";
import { authorize } from "../middleware/auth";
import { handlePrismaError } from "../utils/prisma-error";

const router = Router();

// Get all students
router.get("/", authorize(["ADMIN", "TEACHER"]), async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        class: true,
        user: { select: { email: true, role: true } },
        attendances: true,
        grades: true,
        payments: true,
      },
      orderBy: { name: "asc" },
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data siswa" });
  }
});

// Get student by ID
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        class: true,
        user: { select: { email: true, role: true } },
        attendances: true,
        grades: { include: { subject: true, teacher: { select: { name: true } } } },
        payments: true,
        parents: true,
      },
    });

    if (!student) {
      return res.status(404).json({ error: "Siswa tidak ditemukan" });
    }

    // Allow owner (student) to view their own record, or ADMIN/TEACHER
    const user = (req as any).user;
    if (user.role === "STUDENT" && user.id !== student.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data siswa" });
  }
});

// Create student
router.post("/", authorize(["ADMIN"]), async (req, res) => {
  try {
    const { nis, nisn, name, email, phone, dateOfBirth, gender, address, classId, schoolId, userId } = req.body;

    if (!nis || !nisn || !name || !email || !classId || !schoolId || !userId) {
      return res.status(400).json({ error: "Data siswa tidak lengkap" });
    }

    const student = await prisma.student.create({
      data: {
        nis,
        nisn,
        name,
        email,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        address,
        classId,
        schoolId,
        userId,
      },
      include: { class: true, user: true },
    });

    res.status(201).json(student);
  } catch (error) {
    return handlePrismaError(error, res, "Gagal membuat siswa");
  }
});

// Update student
router.put("/:id", authorize(["ADMIN"]), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { nis, nisn, name, email, phone, dateOfBirth, gender, address, classId } = req.body;

    const student = await prisma.student.update({
      where: { id },
      data: {
        nis,
        nisn,
        name,
        email,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        address,
        classId,
      },
      include: { class: true },
    });

    res.json(student);
  } catch (error) {
    return handlePrismaError(error, res, "Gagal mengupdate siswa");
  }
});

// Delete student
router.delete("/:id", authorize(["ADMIN"]), async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.student.delete({ where: { id } });
    res.json({ message: "Siswa berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus siswa" });
  }
});

export default router;
