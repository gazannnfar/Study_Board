import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/error.js";
import { validateBody } from "../../middleware/validate.js";
import { aiAssistant } from "./ai.service.js";
import { deadlineReminderSchema, taskSuggestionSchema } from "./ai.schemas.js";

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

export default router;
