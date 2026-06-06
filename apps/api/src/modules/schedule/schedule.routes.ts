import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/error.js";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import { createScheduleLesson, deleteScheduleLesson, importSchedule, listSchedule } from "./schedule.service.js";
import { scheduleImportSchema, scheduleLessonSchema, scheduleQuerySchema } from "./schedule.schemas.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  validateQuery(scheduleQuerySchema),
  asyncHandler(async (req, res) => {
    const lessons = await listSchedule(req.user!, req.query);
    res.json({ lessons });
  })
);

router.post(
  "/",
  validateBody(scheduleLessonSchema),
  asyncHandler(async (req, res) => {
    const lesson = await createScheduleLesson(req.user!, req.body);
    res.status(201).json({ lesson });
  })
);

router.post(
  "/import",
  validateBody(scheduleImportSchema),
  asyncHandler(async (req, res) => {
    const result = await importSchedule(req.user!, req.body);
    res.status(201).json(result);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await deleteScheduleLesson(req.user!, req.params.id);
    res.status(204).send();
  })
);

export default router;
