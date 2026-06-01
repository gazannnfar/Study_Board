import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/error.js";
import { getOverviewAnalytics } from "./analytics.service.js";

const router = Router();

router.use(authenticate);

router.get(
  "/overview",
  asyncHandler(async (req, res) => {
    const analytics = await getOverviewAnalytics(req.user!, req.query.groupId?.toString());
    res.json({ analytics });
  })
);

export default router;
