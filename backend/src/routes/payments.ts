import { Router } from "express";
import prisma from "../prisma";
import { authorize } from "../middleware/auth";

async function getTeacherForUser(userId: number) {
  return prisma.teacher.findUnique({ where: { userId } });
}

const router = Router();

// Get all payments
router.get("/", authorize(["ADMIN", "TEACHER"]), async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(payments);
  } catch (error: any) {
    console.error("Payments GET error:", error);
    res.status(500).json({ error: "Gagal mengambil data pembayaran", details: error.message });
  }
});

// Get payments by student ID
router.get("/student/:studentId", async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);
    const user = (req as any).user;
    if (user.role === "STUDENT") {
      const student = await prisma.student.findUnique({ where: { id: studentId } });
      if (!student || student.userId !== user.id) return res.status(403).json({ error: "Forbidden" });
    }

    const payments = await prisma.payment.findMany({
      where: { studentId },
      include: { student: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data pembayaran siswa" });
  }
});

// Create payment
router.post("/", authorize(["ADMIN", "TEACHER"]), async (req, res) => {
  try {
    const { studentId, amount, description, dueDate } = req.body;

    if (!studentId || !amount || !description || !dueDate) {
      return res.status(400).json({ error: "Data pembayaran tidak lengkap" });
    }

    const user = (req as any).user;
    if (user.role === "TEACHER") {
      const teacher = await getTeacherForUser(user.id);
      if (!teacher) return res.status(403).json({ error: "Forbidden" });
      const student = await prisma.student.findUnique({ where: { id: studentId } });
      if (!student) return res.status(404).json({ error: "Student not found" });
      const teachesClass = await prisma.schedule.findFirst({ where: { teacherId: teacher.id, classId: student.classId } });
      if (!teachesClass) return res.status(403).json({ error: "Forbidden: teacher does not teach this student's class" });
    }

    const payment = await prisma.payment.create({
      data: {
        studentId,
        amount,
        description,
        dueDate: new Date(dueDate),
        status: "PENDING",
      },
      include: { student: true },
    });

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ error: "Gagal membuat pembayaran" });
  }
});

// Update payment (mark as paid)
router.put("/:id", authorize(["ADMIN", "TEACHER"]), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status, paidAt } = req.body;

    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) return res.status(404).json({ error: "Payment not found" });

    const user = (req as any).user;
    if (user.role === "TEACHER") {
      const teacher = await getTeacherForUser(user.id);
      if (!teacher) return res.status(403).json({ error: "Forbidden" });
      const student = await prisma.student.findUnique({ where: { id: payment.studentId } });
      if (!student) return res.status(404).json({ error: "Student not found" });
      const teachesClass = await prisma.schedule.findFirst({ where: { teacherId: teacher.id, classId: student.classId } });
      if (!teachesClass) return res.status(403).json({ error: "Forbidden: teacher does not teach this student's class" });
    }

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        status,
        paidAt: paidAt ? new Date(paidAt) : undefined,
      },
      include: { student: true },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengupdate pembayaran" });
  }
});

// Delete payment
router.delete("/:id", authorize(["ADMIN"]), async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.payment.delete({ where: { id } });
    res.json({ message: "Pembayaran berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus pembayaran" });
  }
});

export default router;
