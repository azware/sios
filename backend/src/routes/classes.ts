import { Router } from "express";
import prisma from "../prisma";
import { authorize } from "../middleware/auth";
import { handlePrismaError } from "../utils/prisma-error";

const router = Router();

// Get all classes
router.get("/", authorize(["ADMIN", "TEACHER"]), async (req, res) => {
  try {
    const classes = await prisma.class.findMany({
      include: {
        school: { select: { name: true } },
        students: true,
        schedules: { include: { subject: true, teacher: { select: { name: true } } } },
      },
      orderBy: { name: "asc" },
    });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data kelas" });
  }
});

// Get class by ID
router.get("/:id", authorize(["ADMIN", "TEACHER"]), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const kelas = await prisma.class.findUnique({
      where: { id },
      include: {
        school: true,
        students: { include: { user: { select: { email: true } } } },
        schedules: { include: { subject: true, teacher: { select: { name: true } } } },
      },
    });

    if (!kelas) {
      return res.status(404).json({ error: "Kelas tidak ditemukan" });
    }

    res.json(kelas);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data kelas" });
  }
});

// Create class
router.post("/", authorize(["ADMIN"]), async (req, res) => {
  try {
    const { name, level, schoolId } = req.body;

    if (!name || !level || !schoolId) {
      return res.status(400).json({ error: "Data kelas tidak lengkap" });
    }

    const kelas = await prisma.class.create({
      data: {
        name,
        level,
        schoolId,
      },
      include: { school: true },
    });

    res.status(201).json(kelas);
  } catch (error) {
    return handlePrismaError(error, res, "Gagal membuat kelas");
  }
});

// Update class
router.put("/:id", authorize(["ADMIN"]), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, level } = req.body;

    const kelas = await prisma.class.update({
      where: { id },
      data: { name, level },
      include: { school: true },
    });

    res.json(kelas);
  } catch (error) {
    return handlePrismaError(error, res, "Gagal mengupdate kelas");
  }
});

// Delete class
router.delete("/:id", authorize(["ADMIN"]), async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.class.delete({ where: { id } });
    res.json({ message: "Kelas berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus kelas" });
  }
});

export default router;
