import { Router } from "express";
import * as teamAnalyticsController from "../controllers/teamAnalytics.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  checkTeamMembership,
  checkTeamPermission,
} from "../middleware/teamAuth.middleware";

const router = Router();

router.get(
  "/:teamId/analytics",
  authMiddleware,
  checkTeamMembership,
  checkTeamPermission("canViewAnalytics"),
  teamAnalyticsController.getTeamAnalytics
);

export default router;
