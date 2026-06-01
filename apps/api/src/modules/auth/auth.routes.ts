import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { signAccessToken, verifyPassword } from "../../lib/security.js";
import { authenticate } from "../../middleware/auth.js";
import { AppError, asyncHandler } from "../../middleware/error.js";
import { validateBody } from "../../middleware/validate.js";
import { loginSchema } from "./auth.schemas.js";

const router = Router();

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatarColor: true,
  groupId: true,
  active: true,
  group: { select: { id: true, name: true, code: true } }
};

router.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { email: req.body.email.toLowerCase() },
      include: { group: { select: { id: true, name: true, code: true } } }
    });

    if (!user || !user.active) {
      throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    const passwordIsValid = await verifyPassword(req.body.password, user.passwordHash);
    if (!passwordIsValid) {
      throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const { passwordHash: _passwordHash, ...safeUser } = user;

    res.json({
      token: signAccessToken(user),
      user: safeUser
    });
  })
);

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: userSelect
    });

    res.json({ user });
  })
);

export default router;
