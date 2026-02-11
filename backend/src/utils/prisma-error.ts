import { Prisma } from "@prisma/client";
import { Response } from "express";

export const handlePrismaError = (
  error: unknown,
  res: Response,
  defaultMessage: string
) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = error.meta?.target as string[] | string | undefined;
      let field: string | undefined;
      if (Array.isArray(target)) {
        field = target.includes("name") ? "name" : target[0];
      } else if (typeof target === "string") {
        field = target;
      }
      return res.status(409).json({
        error: "Data sudah terdaftar",
        field,
      });
    }
  }

  return res.status(500).json({ error: defaultMessage });
};
