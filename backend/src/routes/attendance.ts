import { Router } from "express";
import prisma from "../prisma";
import { AttendanceStatus } from "@prisma/client";
import { authorize } from "../middleware/auth";

async function getTeacherForUser(userId: number) {
  return prisma.teacher.findUnique({ where: { userId } });
}

const router = Router();

// Get all attendance records
router.get("/", authorize(["ADMIN", "TEACHER"]), async (req, res) => {
  try {
    const attendances = await prisma.attendance.findMany({
      include: {
        student: { select: { nis: true, name: true } },
      },
      orderBy: { date: "desc" },
    });
    res.json(attendances);
  } catch (error: any) {
    console.error("Attendance GET error:", error);
    res.status(500).json({ error: "Gagal mengambil data kehadiran", details: error.message });
  }
});

// Get attendance by student ID
router.get("/student/:studentId", async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);
    const user = (req as any).user;
    // Allow student to view their own records
    if (user.role === "STUDENT" && user.id !== (await prisma.student.findUnique({ where: { id: studentId } }))?.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (user.role === "PARENT") {
      const parent = await prisma.parent.findUnique({
        where: { userId: user.id },
        select: { students: { select: { id: true } } },
      });
      const allowedIds = parent?.students.map((item) => item.id) ?? [];
      if (!allowedIds.includes(studentId)) return res.status(403).json({ error: "Forbidden" });
    }
    const attendances = await prisma.attendance.findMany({
      where: { studentId },
      include: { student: true },
      orderBy: { date: "desc" },
    });
    res.json(attendances);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data kehadiran siswa" });
  }
});

// Create attendance record
router.post("/", authorize(["ADMIN", "TEACHER"]), async (req, res) => {
  try {
    const { studentId, date, status, note } = req.body;

    if (!studentId || !date || !status) {
      return res.status(400).json({ error: "Data kehadiran tidak lengkap" });
    }

    // If teacher, ensure they are allowed to record attendance for this student's class
    const user = (req as any).user;
    if (user.role === "TEACHER") {
      const teacher = await getTeacherForUser(user.id);
      if (!teacher) return res.status(403).json({ error: "Forbidden" });
      const student = await prisma.student.findUnique({ where: { id: studentId } });
      if (!student) return res.status(404).json({ error: "Student not found" });
      const teachesClass = await prisma.schedule.findFirst({ where: { teacherId: teacher.id, classId: student.classId } });
      if (!teachesClass) return res.status(403).json({ error: "Forbidden: teacher does not teach this student's class" });
    }

    const attendance = await prisma.attendance.create({
      data: {
        studentId,
        date: new Date(date),
        status: status as AttendanceStatus,
        note,
      },
      include: { student: true },
    });

    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ error: "Gagal membuat data kehadiran" });
  }
});

// Update attendance
router.put("/:id", authorize(["ADMIN", "TEACHER"]), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status, note } = req.body;

    const existing = await prisma.attendance.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Attendance not found" });
    }

    const attendance = await prisma.attendance.update({
      where: { id },
      data: { status: status as AttendanceStatus, note },
      include: { student: true },
    });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengupdate kehadiran" });
  }
});

// Delete attendance
router.delete("/:id", authorize(["ADMIN", "TEACHER"]), async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.attendance.delete({ where: { id } });
    res.json({ message: "Data kehadiran berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus kehadiran" });
  }
});

export default router;
