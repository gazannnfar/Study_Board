import { TaskStatus } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { authenticate } from "../../middleware/auth.js";
import { AppError, asyncHandler } from "../../middleware/error.js";
import { visibleTaskWhere } from "../tasks/tasks.service.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const inThreeDays = new Date();
    inThreeDays.setDate(inThreeDays.getDate() + 3);

    const [notifications, deadlineTasks] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user!.id },
        include: { task: { select: { id: true, title: true, deadline: true, priority: true } } },
        orderBy: { createdAt: "desc" },
        take: 30
      }),
      prisma.task.findMany({
        where: {
          AND: [
            visibleTaskWhere(req.user!),
            { status: { not: TaskStatus.DONE } },
            { deadline: { lte: inThreeDays } },
            { OR: [{ assigneeId: req.user!.id }, { creatorId: req.user!.id }] }
          ]
        },
        select: { id: true, title: true, deadline: true, priority: true, status: true },
        orderBy: { deadline: "asc" },
        take: 10
      })
    ]);

    res.json({ notifications, deadlineAlerts: deadlineTasks });
  })
);

router.patch(
  "/:id/read",
  asyncHandler(async (req, res) => {
    const existing = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user!.id }
    });

    if (!existing) {
      throw new AppError(404, "Notification not found", "NOTIFICATION_NOT_FOUND");
    }

    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { readAt: new Date() }
    });

    res.json({ notification });
  })
);

export default router;
