import { Router } from "express";
import prisma from "../prisma";
import { authorize } from "../middleware/auth";

const router = Router();

const ALL_ROLES = ["ADMIN", "TEACHER", "STUDENT", "PARENT"];

router.get("/kpis", authorize(ALL_ROLES), async (req, res) => {
  try {
    const user = (req as any).user as { id: number; role: string };
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    if (user.role === "STUDENT") {
      const student = await prisma.student.findUnique({ where: { userId: user.id } });
      if (!student) {
        return res.json({
          totalStudents: 0,
          totalTeachers: 0,
          totalClasses: 0,
          totalPayments: 0,
          attendanceToday: 0,
          attendancePresentToday: 0,
          attendanceRateToday: 0,
          overduePayments: 0,
          averageGrade: 0,
        });
      }

      const [attendanceToday, attendancePresentToday, totalPayments, overduePayments, gradeAgg] = await Promise.all([
        prisma.attendance.count({
          where: {
            studentId: student.id,
            date: { gte: startOfToday, lt: endOfToday },
          },
        }),
        prisma.attendance.count({
          where: {
            studentId: student.id,
            status: "PRESENT",
            date: { gte: startOfToday, lt: endOfToday },
          },
        }),
        prisma.payment.count({ where: { studentId: student.id } }),
        prisma.payment.count({
          where: {
            studentId: student.id,
            status: { not: "PAID" },
            dueDate: { lt: startOfToday },
          },
        }),
        prisma.grade.aggregate({
          where: { studentId: student.id },
          _avg: { score: true },
        }),
      ]);

      return res.json({
        totalStudents: 1,
        totalTeachers: 0,
        totalClasses: 0,
        totalPayments,
        attendanceToday,
        attendancePresentToday,
        attendanceRateToday: attendanceToday > 0 ? Math.round((attendancePresentToday / attendanceToday) * 10000) / 100 : 0,
        overduePayments,
        averageGrade: gradeAgg._avg.score ? Math.round(gradeAgg._avg.score * 100) / 100 : 0,
      });
    }

    if (user.role === "PARENT") {
      const parent = await prisma.parent.findUnique({
        where: { userId: user.id },
        select: { students: { select: { id: true } } },
      });
      const studentIds = parent?.students.map((s) => s.id) || [];
      if (studentIds.length === 0) {
        return res.json({
          totalStudents: 0,
          totalTeachers: 0,
          totalClasses: 0,
          totalPayments: 0,
          attendanceToday: 0,
          attendancePresentToday: 0,
          attendanceRateToday: 0,
          overduePayments: 0,
          averageGrade: 0,
        });
      }

      const [attendanceToday, attendancePresentToday, totalPayments, overduePayments, gradeAgg] = await Promise.all([
        prisma.attendance.count({
          where: {
            studentId: { in: studentIds },
            date: { gte: startOfToday, lt: endOfToday },
          },
        }),
        prisma.attendance.count({
          where: {
            studentId: { in: studentIds },
            status: "PRESENT",
            date: { gte: startOfToday, lt: endOfToday },
          },
        }),
        prisma.payment.count({ where: { studentId: { in: studentIds } } }),
        prisma.payment.count({
          where: {
            studentId: { in: studentIds },
            status: { not: "PAID" },
            dueDate: { lt: startOfToday },
          },
        }),
        prisma.grade.aggregate({
          where: { studentId: { in: studentIds } },
          _avg: { score: true },
        }),
      ]);

      return res.json({
        totalStudents: studentIds.length,
        totalTeachers: 0,
        totalClasses: 0,
        totalPayments,
        attendanceToday,
        attendancePresentToday,
        attendanceRateToday: attendanceToday > 0 ? Math.round((attendancePresentToday / attendanceToday) * 10000) / 100 : 0,
        overduePayments,
        averageGrade: gradeAgg._avg.score ? Math.round(gradeAgg._avg.score * 100) / 100 : 0,
      });
    }

    const [totalStudents, totalTeachers, totalClasses, totalPayments, attendanceToday, attendancePresentToday, overduePayments, gradeAgg] =
      await Promise.all([
        prisma.student.count(),
        prisma.teacher.count(),
        prisma.class.count(),
        prisma.payment.count(),
        prisma.attendance.count({
          where: {
            date: { gte: startOfToday, lt: endOfToday },
          },
        }),
        prisma.attendance.count({
          where: {
            status: "PRESENT",
            date: { gte: startOfToday, lt: endOfToday },
          },
        }),
        prisma.payment.count({
          where: {
            status: { not: "PAID" },
            dueDate: { lt: startOfToday },
          },
        }),
        prisma.grade.aggregate({ _avg: { score: true } }),
      ]);

    return res.json({
      totalStudents,
      totalTeachers,
      totalClasses,
      totalPayments,
      attendanceToday,
      attendancePresentToday,
      attendanceRateToday: attendanceToday > 0 ? Math.round((attendancePresentToday / attendanceToday) * 10000) / 100 : 0,
      overduePayments,
      averageGrade: gradeAgg._avg.score ? Math.round(gradeAgg._avg.score * 100) / 100 : 0,
    });
  } catch {
    return res.status(500).json({ error: "Gagal mengambil data KPI dashboard" });
  }
});

export default router;
