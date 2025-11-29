import { Router } from "express";
import * as teamActivityController from "../controllers/teamActivity.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { checkTeamMembership } from "../middleware/teamAuth.middleware";

const router = Router();

router.get(
  "/:teamId/activity-feed",
  authMiddleware,
  checkTeamMembership,
  teamActivityController.getActivityFeed
);

router.get(
  "/:teamId/milestones",
  authMiddleware,
  checkTeamMembership,
  teamActivityController.getMilestones
);

export default router;
