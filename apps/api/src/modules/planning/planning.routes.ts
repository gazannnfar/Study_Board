import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/error.js";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import { assignSlotSchema, freeSlotsQuerySchema, taskRecommendationsQuerySchema } from "./planning.schemas.js";
import type { FreeSlotsQuery, TaskRecommendationsQuery } from "./planning.schemas.js";
import { assignTaskSlot, getFreeSlots, getTaskRecommendations } from "./planning.service.js";

const router = Router();

router.use(authenticate);

router.get(
  "/free-slots",
  validateQuery(freeSlotsQuerySchema),
  asyncHandler(async (req, res) => {
    const slots = await getFreeSlots(req.user!, req.query as unknown as FreeSlotsQuery);
    res.json({ slots });
  })
);

router.get(
  "/task-recommendations",
  validateQuery(taskRecommendationsQuerySchema),
  asyncHandler(async (req, res) => {
    const recommendations = await getTaskRecommendations(req.user!, req.query as unknown as TaskRecommendationsQuery);
    res.json({ recommendations });
  })
);

router.post(
  "/assign-slot",
  validateBody(assignSlotSchema),
  asyncHandler(async (req, res) => {
    const task = await assignTaskSlot(req.user!, req.body);
    res.json({ task });
  })
);

export default router;
