import { Role } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { authenticate } from "../../middleware/auth.js";
import { AppError, asyncHandler } from "../../middleware/error.js";
import { validateBody } from "../../middleware/validate.js";
import { canCreateGroup, canSeeAllGroups } from "../rbac/permissions.js";
import { createGroupSchema, updateGroupSchema } from "./groups.schemas.js";

const router = Router();

const groupInclude = {
  teacher: { select: { id: true, name: true, email: true } },
  users: {
    select: { id: true, name: true, email: true, role: true, avatarColor: true, active: true },
    orderBy: { name: "asc" as const }
  },
  projects: {
    select: {
      id: true,
      name: true,
      description: true,
      managerId: true,
      teamLeadId: true
    },
    orderBy: { name: "asc" as const }
  }
};

router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const where = canSeeAllGroups(req.user!.role)
      ? {}
      : req.user!.role === Role.TEACHER
        ? { teacherId: req.user!.id }
        : { id: req.user!.groupId ?? "__none" };

    const groups = await prisma.group.findMany({
      where,
      include: groupInclude,
      orderBy: { code: "asc" }
    });

    res.json({ groups });
  })
);

router.post(
  "/",
  validateBody(createGroupSchema),
  asyncHandler(async (req, res) => {
    if (!canCreateGroup(req.user!.role)) {
      throw new AppError(403, "Not enough permissions to create groups", "FORBIDDEN");
    }

    const group = await prisma.group.create({
      data: req.body,
      include: groupInclude
    });

    res.status(201).json({ group });
  })
);

router.patch(
  "/:id",
  validateBody(updateGroupSchema),
  asyncHandler(async (req, res) => {
    if (!canCreateGroup(req.user!.role)) {
      throw new AppError(403, "Not enough permissions to edit groups", "FORBIDDEN");
    }

    const group = await prisma.group.update({
      where: { id: req.params.id },
      data: req.body,
      include: groupInclude
    });

    res.json({ group });
  })
);

export default router;
