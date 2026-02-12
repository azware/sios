import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import authRouter from "./routes/auth";
import studentsRouter from "./routes/students";
import teachersRouter from "./routes/teachers";
import classesRouter from "./routes/classes";
import subjectsRouter from "./routes/subjects";
import attendanceRouter from "./routes/attendance";
import gradesRouter from "./routes/grades";
import paymentsRouter from "./routes/payments";
import schoolsRouter from "./routes/schools";
import usersRouter from "./routes/users";
import auditLogsRouter from "./routes/audit-logs";
import { authenticate } from "./middleware/auth";
import prisma from "./prisma";
import { auditLogger } from "./middleware/audit";

const app = express();
app.use(cors());
app.use(express.json());

// Routes
// Public auth routes
app.use("/api/auth", authRouter);

// Protected API routes (require authentication)
app.use("/api/students", authenticate, auditLogger, studentsRouter);
app.use("/api/teachers", authenticate, auditLogger, teachersRouter);
app.use("/api/classes", authenticate, auditLogger, classesRouter);
app.use("/api/subjects", authenticate, auditLogger, subjectsRouter);
app.use("/api/attendance", authenticate, auditLogger, attendanceRouter);
app.use("/api/grades", authenticate, auditLogger, gradesRouter);
app.use("/api/payments", authenticate, auditLogger, paymentsRouter);
app.use("/api/schools", authenticate, auditLogger, schoolsRouter);
app.use("/api/users", authenticate, auditLogger, usersRouter);
app.use("/api/audit-logs", authenticate, auditLogger, auditLogsRouter);

// Health check
app.get("/api/health", (_, res) => res.json({ status: "ok" }));
app.get("/api/health/ready", async (_, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ status: "ready", db: "up" });
  } catch {
    return res.status(503).json({ status: "not_ready", db: "down" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
