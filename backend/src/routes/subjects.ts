import { Router } from "express";
import prisma from "../prisma";
import { authorize } from "../middleware/auth";
import { handlePrismaError } from "../utils/prisma-error";

const router = Router();

// Get all subjects
router.get("/", authorize(["ADMIN", "TEACHER"]), async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        teachers: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data mata pelajaran" });
  }
});

// Get subject by ID
router.get("/:id", authorize(["ADMIN", "TEACHER"]), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        teachers: true,
        schedules: { include: { class: true, teacher: { select: { name: true } } } },
        grades: { include: { student: { select: { name: true } } } },
      },
    });

    if (!subject) {
      return res.status(404).json({ error: "Mata pelajaran tidak ditemukan" });
    }

    res.json(subject);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data mata pelajaran" });
  }
});

// Create subject
router.post("/", authorize(["ADMIN"]), async (req, res) => {
  try {
    const { code, name, description } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: "Kode dan nama mata pelajaran diperlukan" });
    }

    const subject = await prisma.subject.create({
      data: {
        code,
        name,
        description,
      },
    });

    res.status(201).json(subject);
  } catch (error) {
    return handlePrismaError(error, res, "Gagal membuat mata pelajaran");
  }
});

// Update subject
router.put("/:id", authorize(["ADMIN"]), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { code, name, description } = req.body;

    const subject = await prisma.subject.update({
      where: { id },
      data: { code, name, description },
    });

    res.json(subject);
  } catch (error) {
    return handlePrismaError(error, res, "Gagal mengupdate mata pelajaran");
  }
});

// Delete subject
router.delete("/:id", authorize(["ADMIN"]), async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.subject.delete({ where: { id } });
    res.json({ message: "Mata pelajaran berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus mata pelajaran" });
  }
});

export default router;
