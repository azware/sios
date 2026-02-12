import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../prisma";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
]);

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== "object") return value;

  const output: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    if (SENSITIVE_KEYS.has(key)) {
      output[key] = "***";
    } else {
      output[key] = sanitize(val);
    }
  }
  return output;
}

export const auditLogger = (req: Request, res: Response, next: NextFunction) => {
  if (!MUTATING_METHODS.has(req.method)) return next();
  if (!req.path.startsWith("/api/")) return next();

  const user = (req as any).user as { id?: number } | undefined;
  const requestBody = sanitize(req.body);
  const path = req.originalUrl.split("?")[0];
  const ip = req.ip || req.socket.remoteAddress || null;
  const userAgent = req.get("user-agent") || null;

  res.on("finish", () => {
    const statusCode = res.statusCode;
    if (statusCode < 200 || statusCode >= 500) return;

    prisma.auditLog
      .create({
        data: {
          userId: user?.id,
          method: req.method,
          path,
          statusCode,
          ip,
          userAgent,
          requestBody:
            requestBody === undefined || requestBody === null
              ? Prisma.JsonNull
              : (requestBody as Prisma.InputJsonValue),
        },
      })
      .catch(() => {
        // Keep request path non-blocking even if audit insert fails.
      });
  });

  return next();
};
