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
import { authenticate } from "./middleware/auth";

const app = express();
app.use(cors());
app.use(express.json());

// Routes
// Public auth routes
app.use("/api/auth", authRouter);

// Protected API routes (require authentication)
app.use("/api/students", authenticate, studentsRouter);
app.use("/api/teachers", authenticate, teachersRouter);
app.use("/api/classes", authenticate, classesRouter);
app.use("/api/subjects", authenticate, subjectsRouter);
app.use("/api/attendance", authenticate, attendanceRouter);
app.use("/api/grades", authenticate, gradesRouter);
app.use("/api/payments", authenticate, paymentsRouter);
app.use("/api/schools", authenticate, schoolsRouter);
app.use("/api/users", authenticate, usersRouter);

// Health check
app.get("/api/health", (_, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
