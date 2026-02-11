import { Router } from "express";
import prisma from "../prisma";
import { authorize } from "../middleware/auth";

async function getTeacherForUser(userId: number) {
  return prisma.teacher.findUnique({ where: { userId } });
}

const router = Router();

// Get all grades
router.get("/", authorize(["ADMIN", "TEACHER"]), async (req, res) => {
  try {
    const grades = await prisma.grade.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(grades);
  } catch (error: any) {
    console.error("Grades GET error:", error);
    res.status(500).json({ error: "Gagal mengambil data nilai", details: error.message });
  }
});

// Get grades by student ID
router.get("/student/:studentId", async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);
    const user = (req as any).user;
    if (user.role === "STUDENT") {
      const student = await prisma.student.findUnique({ where: { id: studentId } });
      if (!student || student.userId !== user.id) return res.status(403).json({ error: "Forbidden" });
    }
    const grades = await prisma.grade.findMany({
      where: { studentId },
      include: {
        student: true,
        subject: true,
        teacher: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(grades);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil nilai siswa" });
  }
});

// Get grades by subject
router.get("/subject/:subjectId", authorize(["ADMIN", "TEACHER"]), async (req, res) => {
  try {
    const subjectId = Number(req.params.subjectId);
    const grades = await prisma.grade.findMany({
      where: { subjectId },
      include: {
        student: { select: { nis, name: true } },
        subject: true,
        teacher: { select: { name: true } },
      },
      orderBy: { student: { name: "asc" } },
    });
    res.json(grades);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil nilai mata pelajaran" });
  }
});

// Create grade
router.post("/", authorize(["ADMIN", "TEACHER"]), async (req, res) => {
  try {
    const { studentId, subjectId, teacherId, score, term, academicYear } = req.body;

    if (!studentId || !subjectId || !teacherId || score === undefined || !term || !academicYear) {
      return res.status(400).json({ error: "Data nilai tidak lengkap" });
    }

    // If the requester is a teacher, ensure they can only create grades for themselves and for subjects they teach
    const user = (req as any).user;
    if (user.role === "TEACHER") {
      const teacher = await getTeacherForUser(user.id);
      if (!teacher) return res.status(403).json({ error: "Forbidden: not a teacher" });
      if (teacherId && teacherId !== teacher.id) return res.status(403).json({ error: "Forbidden: cannot create grade for other teacher" });

      const teachesSubject = await prisma.teacher.findFirst({
        where: {
          id: teacher.id,
          OR: [
            { subjects: { some: { id: subjectId } } },
            { schedules: { some: { subjectId } } },
          ],
        },
      });
      if (!teachesSubject) return res.status(403).json({ error: "Forbidden: teacher not assigned to this subject" });
    }

    // Check if grade already exists
    const existingGrade = await prisma.grade.findUnique({
      where: {
        studentId_subjectId_term_academicYear: {
          studentId,
          subjectId,
          term,
          academicYear,
        },
      },
    });

    if (existingGrade) {
      return res.status(400).json({ error: "Nilai untuk siswa dan mata pelajaran ini sudah ada" });
    }

    const grade = await prisma.grade.create({
      data: {
        studentId,
        subjectId,
        teacherId,
        score,
        term,
        academicYear,
      },
      include: {
        student: { select: { name: true } },
        subject: { select: { name: true } },
        teacher: { select: { name: true } },
      },
    });

    res.status(201).json(grade);
  } catch (error) {
    res.status(500).json({ error: "Gagal membuat nilai" });
  }
});

// Update grade
router.put("/:id", authorize(["ADMIN", "TEACHER"]), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { score } = req.body;

    if (score === undefined) {
      return res.status(400).json({ error: "Nilai harus diisi" });
    }

    const grade = await prisma.grade.findUnique({ where: { id } });
    if (!grade) return res.status(404).json({ error: "Grade not found" });

    const user = (req as any).user;
    if (user.role === "TEACHER") {
      const teacher = await getTeacherForUser(user.id);
      if (!teacher) return res.status(403).json({ error: "Forbidden" });
      if (grade.teacherId !== teacher.id) return res.status(403).json({ error: "Forbidden: cannot modify grades by other teachers" });
    }

    const updated = await prisma.grade.update({
      where: { id },
      data: { score },
      include: {
        student: { select: { name: true } },
        subject: { select: { name: true } },
        teacher: { select: { name: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengupdate nilai" });
  }
});

// Delete grade
router.delete("/:id", authorize(["ADMIN", "TEACHER"]), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const grade = await prisma.grade.findUnique({ where: { id } });
    if (!grade) return res.status(404).json({ error: "Grade not found" });

    const user = (req as any).user;
    if (user.role === "TEACHER") {
      const teacher = await getTeacherForUser(user.id);
      if (!teacher) return res.status(403).json({ error: "Forbidden" });
      if (grade.teacherId !== teacher.id) return res.status(403).json({ error: "Forbidden: cannot delete grades by other teachers" });
    }

    await prisma.grade.delete({ where: { id } });
    res.json({ message: "Nilai berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus nilai" });
  }
});

export default router;
