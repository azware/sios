import { Router } from "express";
import prisma from "../prisma";
import { authorize } from "../middleware/auth";
import { handlePrismaError } from "../utils/prisma-error";

const router = Router();

// Get all teachers
router.get("/", authorize(["ADMIN", "TEACHER"]), async (req, res) => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        school: { select: { name: true } },
        user: { select: { email: true, role: true } },
        subjects: true,
        schedules: { include: { class: true, subject: true } },
      },
      orderBy: { name: "asc" },
    });
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data guru" });
  }
});

// Get teacher by ID
router.get("/:id", authorize(["ADMIN", "TEACHER"]), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        school: true,
        user: { select: { email: true, role: true } },
        subjects: true,
        schedules: { include: { class: true, subject: true } },
        grades: { include: { student: true, subject: true } },
      },
    });

    if (!teacher) {
      return res.status(404).json({ error: "Guru tidak ditemukan" });
    }

    res.json(teacher);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data guru" });
  }
});

// Create teacher
router.post("/", authorize(["ADMIN"]), async (req, res) => {
  try {
    const { nip, name, email, phone, schoolId, userId } = req.body;

    if (!nip || !name || !email || !schoolId || !userId) {
      return res.status(400).json({ error: "Data guru tidak lengkap" });
    }

    const teacher = await prisma.teacher.create({
      data: {
        nip,
        name,
        email,
        phone,
        schoolId,
        userId,
      },
      include: { school: true, user: true },
    });

    res.status(201).json(teacher);
  } catch (error) {
    return handlePrismaError(error, res, "Gagal membuat guru");
  }
});

// Update teacher
router.put("/:id", authorize(["ADMIN"]), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { nip, name, email, phone } = req.body;

    const teacher = await prisma.teacher.update({
      where: { id },
      data: { nip, name, email, phone },
      include: { school: true },
    });

    res.json(teacher);
  } catch (error) {
    return handlePrismaError(error, res, "Gagal mengupdate guru");
  }
});

// Delete teacher
router.delete("/:id", authorize(["ADMIN"]), async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.teacher.delete({ where: { id } });
    res.json({ message: "Guru berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus guru" });
  }
});

export default router;
