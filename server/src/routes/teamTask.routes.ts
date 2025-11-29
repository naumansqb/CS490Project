import { Router } from "express";
import * as teamTaskController from "../controllers/teamTask.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  checkTeamMembership,
  checkMentorOrCoachRole,
} from "../middleware/teamAuth.middleware";

const router = Router();

router.post(
  "/:teamId/tasks",
  authMiddleware,
  checkTeamMembership,
  checkMentorOrCoachRole,
  teamTaskController.createTask
);

router.get(
  "/:teamId/tasks",
  authMiddleware,
  checkTeamMembership,
  teamTaskController.getAllTasks
);

router.get(
  "/:teamId/tasks/assigned-to/:userId",
  authMiddleware,
  checkTeamMembership,
  teamTaskController.getTasksForUser
);

router.put(
  "/:teamId/tasks/:taskId",
  authMiddleware,
  checkTeamMembership,
  teamTaskController.updateTask
);

router.delete(
  "/:teamId/tasks/:taskId",
  authMiddleware,
  checkTeamMembership,
  teamTaskController.deleteTask
);

export default router;
