import { Router } from "express";
import prisma from "../prisma";
import { authorize } from "../middleware/auth";

const router = Router();

// Admin audit log listing with basic filters.
router.get("/", authorize(["ADMIN"]), async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 20)));
    const method = (req.query.method as string | undefined)?.toUpperCase();
    const path = req.query.path as string | undefined;
    const userIdParam = req.query.userId as string | undefined;

    const where: Record<string, unknown> = {};
    if (method) where.method = method;
    if (path) where.path = { contains: path, mode: "insensitive" };
    if (userIdParam && !Number.isNaN(Number(userIdParam))) {
      where.userId = Number(userIdParam);
    }

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return res.json({
      data: items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch {
    return res.status(500).json({ error: "Gagal mengambil audit log" });
  }
});

export default router;
