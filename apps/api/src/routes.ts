import { Router } from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import groupsRoutes from "./modules/groups/groups.routes.js";
import tasksRoutes from "./modules/tasks/tasks.routes.js";
import analyticsRoutes from "./modules/analytics/analytics.routes.js";
import notificationsRoutes from "./modules/notifications/notifications.routes.js";
import aiRoutes from "./modules/ai/ai.routes.js";
import scheduleRoutes from "./modules/schedule/schedule.routes.js";
import planningRoutes from "./modules/planning/planning.routes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "EduKanban API" });
});

apiRouter.use("/auth", authRoutes);
apiRouter.use("/users", usersRoutes);
apiRouter.use("/groups", groupsRoutes);
apiRouter.use("/tasks", tasksRoutes);
apiRouter.use("/analytics", analyticsRoutes);
apiRouter.use("/notifications", notificationsRoutes);
apiRouter.use("/ai", aiRoutes);
apiRouter.use("/schedule", scheduleRoutes);
apiRouter.use("/planning", planningRoutes);
