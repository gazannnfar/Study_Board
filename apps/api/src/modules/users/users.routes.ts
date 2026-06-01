import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { hashPassword } from "../../lib/security.js";
import { authenticate, requireRoles } from "../../middleware/auth.js";
import { AppError, asyncHandler } from "../../middleware/error.js";
import { validateBody } from "../../middleware/validate.js";
import { canSeeAllGroups } from "../rbac/permissions.js";
import { Role } from "@prisma/client";
import { createUserSchema, updateUserSchema } from "./users.schemas.js";

const router = Router();

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatarColor: true,
  active: true,
  lastLoginAt: true,
  groupId: true,
  group: { select: { id: true, name: true, code: true } },
  createdAt: true
};

router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const where = canSeeAllGroups(req.user!.role)
      ? {}
      : req.user!.role === Role.TEACHER
        ? { OR: [{ group: { is: { teacherId: req.user!.id } } }, { id: req.user!.id }] }
        : { OR: [{ groupId: req.user!.groupId ?? "__none" }, { id: req.user!.id }] };

    const users = await prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: [{ active: "desc" }, { name: "asc" }]
    });

    res.json({ users });
  })
);

router.post(
  "/",
  requireRoles(Role.ADMIN),
  validateBody(createUserSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.create({
      data: {
        email: req.body.email.toLowerCase(),
        passwordHash: await hashPassword(req.body.password),
        name: req.body.name,
        role: req.body.role,
        groupId: req.body.groupId ?? null,
        avatarColor: req.body.avatarColor ?? "#2563eb"
      },
      select: userSelect
    });

    res.status(201).json({ user });
  })
);

router.patch(
  "/:id",
  requireRoles(Role.ADMIN),
  validateBody(updateUserSchema),
  asyncHandler(async (req, res) => {
    const { password, email, ...rest } = req.body;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        email: email?.toLowerCase(),
        passwordHash: password ? await hashPassword(password) : undefined
      },
      select: userSelect
    });

    res.json({ user });
  })
);

router.delete(
  "/:id",
  requireRoles(Role.ADMIN),
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user!.id) {
      throw new AppError(400, "Admin cannot deactivate own account", "SELF_DEACTIVATE");
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { active: false },
      select: userSelect
    });

    res.json({ user });
  })
);

export default router;
