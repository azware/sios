import { Router } from "express";
import prisma from "../prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { handlePrismaError } from "../utils/prisma-error";

const router = Router();

// Register endpoint
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, role = "STUDENT" } = req.body;

    // Validasi input
    if (!username || !email || !password) {
      return res.status(400).json({ error: "username, email, dan password diperlukan" });
    }

    // Cek username atau email sudah terdaftar
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Username atau email sudah terdaftar" });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Buat user baru
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hash,
        role: role as UserRole,
      },
    });

    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    return handlePrismaError(error, res, "Kesalahan server saat registrasi");
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "username dan password diperlukan" });
    }

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return res.status(401).json({ error: "Username atau password salah" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Username atau password salah" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Kesalahan server saat login" });
  }
});

export default router;
