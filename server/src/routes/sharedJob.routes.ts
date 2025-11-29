import { Router } from "express";
import * as sharedJobController from "../controllers/sharedJob.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  checkTeamMembership,
  checkTeamPermission,
} from "../middleware/teamAuth.middleware";

const router = Router();

router.post(
  "/:teamId/shared-jobs",
  authMiddleware,
  checkTeamMembership,
  checkTeamPermission("canShareJobs"),
  sharedJobController.shareJob
);

router.get(
  "/:teamId/shared-jobs",
  authMiddleware,
  checkTeamMembership,
  sharedJobController.getSharedJobs
);

router.get(
  "/:teamId/shared-jobs/:shareId",
  authMiddleware,
  checkTeamMembership,
  sharedJobController.getSharedJobById
);

router.delete(
  "/:teamId/shared-jobs/:shareId",
  authMiddleware,
  checkTeamMembership,
  sharedJobController.unshareJob
);

router.post(
  "/:teamId/shared-jobs/:shareId/comments",
  authMiddleware,
  checkTeamMembership,
  sharedJobController.addComment
);

router.get(
  "/:teamId/shared-jobs/:shareId/comments",
  authMiddleware,
  checkTeamMembership,
  sharedJobController.getComments
);

router.put(
  "/:teamId/shared-jobs/:shareId/comments/:commentId",
  authMiddleware,
  checkTeamMembership,
  sharedJobController.updateComment
);

router.delete(
  "/:teamId/shared-jobs/:shareId/comments/:commentId",
  authMiddleware,
  checkTeamMembership,
  sharedJobController.deleteComment
);

export default router;
