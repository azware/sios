import { Router } from "express";
import prisma from "../prisma";
import { authorize } from "../middleware/auth";
import { UserRole } from "@prisma/client";

const router = Router();

// Get users, optionally filter by role
router.get("/", authorize(["ADMIN"]), async (req, res) => {
  try {
    const roleParam = req.query.role as string | undefined;
    let roleFilter: UserRole | undefined = undefined;

    if (roleParam) {
      const role = roleParam.toUpperCase();
      if (!Object.values(UserRole).includes(role as UserRole)) {
        return res.status(400).json({ error: "Role tidak valid" });
      }
      roleFilter = role as UserRole;
    }

    const users = await prisma.user.findMany({
      where: roleFilter ? { role: roleFilter } : undefined,
      select: { id: true, username: true, email: true, role: true },
      orderBy: { username: "asc" },
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data user" });
  }
});

export default router;
