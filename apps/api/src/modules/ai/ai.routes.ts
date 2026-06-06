import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/error.js";
import { validateBody } from "../../middleware/validate.js";
import { aiAssistant } from "./ai.service.js";
import { deadlineReminderSchema, pertSchema, scheduleReviewSchema, taskSuggestionSchema } from "./ai.schemas.js";

const router = Router();

router.use(authenticate);

router.post(
  "/task-suggestions",
  validateBody(taskSuggestionSchema),
  asyncHandler(async (req, res) => {
    const suggestion = await aiAssistant.suggestTask(req.body);
    res.json({ suggestion });
  })
);

router.post(
  "/deadline-reminder",
  validateBody(deadlineReminderSchema),
  asyncHandler(async (req, res) => {
    const reminder = await aiAssistant.buildDeadlineReminder(req.body);
    res.json({ reminder });
  })
);

router.post(
  "/pert",
  validateBody(pertSchema),
  asyncHandler(async (req, res) => {
    const pert = aiAssistant.estimatePert(req.body);
    res.json({ pert });
  })
);

router.post(
  "/schedule-review",
  validateBody(scheduleReviewSchema),
  asyncHandler(async (req, res) => {
    const review = await aiAssistant.reviewScheduleContext(req.body);
    res.json({ review });
  })
);

export default router;
