import { Router } from "express";
import prisma from "../prisma";
import { authorize } from "../middleware/auth";

const router = Router();
const ALL_ROLES = ["ADMIN", "TEACHER", "STUDENT", "PARENT"];

type NotificationItem = {
  id: string;
  type: "PAYMENT_OVERDUE" | "ATTENDANCE_ALERT" | "GRADE_ALERT";
  severity: "high" | "medium";
  title: string;
  message: string;
  count: number;
  link: string;
};

router.get("/", authorize(ALL_ROLES), async (req, res) => {
  try {
    const user = (req as any).user as { id: number; role: string };
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const lowGradeThreshold = Number(process.env.LOW_GRADE_THRESHOLD || 70);

    let studentIds: number[] | null = null;
    if (user.role === "STUDENT") {
      const student = await prisma.student.findUnique({ where: { userId: user.id }, select: { id: true } });
      studentIds = student ? [student.id] : [];
    } else if (user.role === "PARENT") {
      const parent = await prisma.parent.findUnique({
        where: { userId: user.id },
        select: { students: { select: { id: true } } },
      });
      studentIds = parent?.students.map((s) => s.id) ?? [];
    }

    const paymentWhere: any = {
      status: { not: "PAID" },
      dueDate: { lt: startOfToday },
    };
    const attendanceWhere: any = {
      date: { gte: startOfToday, lt: endOfToday },
      status: { not: "PRESENT" },
    };
    const gradeWhere: any = {
      score: { lt: lowGradeThreshold },
    };

    if (studentIds) {
      paymentWhere.studentId = { in: studentIds };
      attendanceWhere.studentId = { in: studentIds };
      gradeWhere.studentId = { in: studentIds };
    }

    const [overduePayments, attendanceAlerts, gradeAlerts] = await Promise.all([
      prisma.payment.count({ where: paymentWhere }),
      prisma.attendance.count({ where: attendanceWhere }),
      prisma.grade.count({ where: gradeWhere }),
    ]);

    const notifications: NotificationItem[] = [];

    if (overduePayments > 0) {
      notifications.push({
        id: "payment-overdue",
        type: "PAYMENT_OVERDUE",
        severity: "high",
        title: "Tunggakan pembayaran",
        message: `${overduePayments} pembayaran melewati jatuh tempo.`,
        count: overduePayments,
        link: "/dashboard/payments",
      });
    }

    if (attendanceAlerts > 0) {
      notifications.push({
        id: "attendance-alert",
        type: "ATTENDANCE_ALERT",
        severity: "medium",
        title: "Peringatan kehadiran hari ini",
        message: `${attendanceAlerts} catatan kehadiran non-hadir terdeteksi hari ini.`,
        count: attendanceAlerts,
        link: "/dashboard/attendance",
      });
    }

    if (gradeAlerts > 0) {
      notifications.push({
        id: "grade-alert",
        type: "GRADE_ALERT",
        severity: "medium",
        title: "Nilai di bawah ambang batas",
        message: `${gradeAlerts} nilai berada di bawah ${lowGradeThreshold}.`,
        count: gradeAlerts,
        link: "/dashboard/grades",
      });
    }

    return res.json({
      total: notifications.length,
      items: notifications,
    });
  } catch {
    return res.status(500).json({ error: "Gagal mengambil notifikasi" });
  }
});

export default router;
