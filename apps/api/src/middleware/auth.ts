import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { verifyAccessToken } from "../lib/security.js";
import { AppError } from "./error.js";

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (!token) {
    return next(new AppError(401, "Authorization token is required", "AUTH_REQUIRED"));
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true, groupId: true, active: true }
    });

    if (!user || !user.active) {
      return next(new AppError(401, "User is inactive or does not exist", "AUTH_INVALID"));
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      groupId: user.groupId
    };
    return next();
  } catch {
    return next(new AppError(401, "Invalid or expired token", "AUTH_INVALID"));
  }
}

export function requireRoles(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "Authorization token is required", "AUTH_REQUIRED"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, "Not enough permissions for this action", "FORBIDDEN"));
    }

    return next();
  };
}
