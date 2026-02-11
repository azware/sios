import { Router } from "express";
import prisma from "../prisma";
import { authorize } from "../middleware/auth";
import { handlePrismaError } from "../utils/prisma-error";

const router = Router();

// Get all schools
router.get("/", authorize(["ADMIN"]), async (_req, res) => {
  try {
    const schools = await prisma.school.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    res.json(schools);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data sekolah" });
  }
});

// Get school by ID
router.get("/:id", authorize(["ADMIN"]), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const school = await prisma.school.findUnique({
      where: { id },
      include: { classes: true, teachers: true, students: true },
    });

    if (!school) {
      return res.status(404).json({ error: "Sekolah tidak ditemukan" });
    }

    res.json(school);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data sekolah" });
  }
});

// Create school
router.post("/", authorize(["ADMIN"]), async (req, res) => {
  try {
    const { name, address, phone, email } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Nama sekolah wajib diisi" });
    }

    const school = await prisma.school.create({
      data: { name, address, phone, email },
    });

    res.status(201).json(school);
  } catch (error) {
    return handlePrismaError(error, res, "Gagal membuat sekolah");
  }
});

// Update school
router.put("/:id", authorize(["ADMIN"]), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, address, phone, email } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Nama sekolah wajib diisi" });
    }

    const school = await prisma.school.update({
      where: { id },
      data: { name, address, phone, email },
    });

    res.json(school);
  } catch (error) {
    return handlePrismaError(error, res, "Gagal mengupdate sekolah");
  }
});

// Delete school
router.delete("/:id", authorize(["ADMIN"]), async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.school.delete({ where: { id } });
    res.json({ message: "Sekolah berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus sekolah" });
  }
});

export default router;
