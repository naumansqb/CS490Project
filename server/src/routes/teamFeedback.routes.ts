import { Router } from "express";
import * as teamFeedbackController from "../controllers/teamFeedback.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  checkTeamMembership,
  checkMentorOrCoachRole,
} from "../middleware/teamAuth.middleware";

const router = Router();

router.get(
  "/:teamId/mentees",
  authMiddleware,
  checkTeamMembership,
  checkMentorOrCoachRole,
  teamFeedbackController.getMentees
);

router.get(
  "/:teamId/mentees/:userId/progress",
  authMiddleware,
  checkTeamMembership,
  teamFeedbackController.getMenteeProgress
);

router.post(
  "/:teamId/feedback",
  authMiddleware,
  checkTeamMembership,
  checkMentorOrCoachRole,
  teamFeedbackController.createFeedback
);

router.get(
  "/:teamId/feedback/mentee/:userId",
  authMiddleware,
  checkTeamMembership,
  teamFeedbackController.getFeedbackForMentee
);

router.get(
  "/:teamId/feedback",
  authMiddleware,
  checkTeamMembership,
  teamFeedbackController.getAllFeedback
);

export default router;
