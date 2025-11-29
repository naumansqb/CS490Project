import { Router } from "express";
import * as teamController from "../controllers/team.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  checkTeamMembership,
  checkTeamPermission,
  checkTeamOwnership,
} from "../middleware/teamAuth.middleware";

const router = Router();

router.post("/", authMiddleware, teamController.createTeam);
router.get("/my-teams", authMiddleware, teamController.getMyTeams);
router.get(
  "/:teamId",
  authMiddleware,
  checkTeamMembership,
  teamController.getTeamById
);
router.put(
  "/:teamId",
  authMiddleware,
  checkTeamMembership,
  checkTeamPermission("canManageMembers"),
  teamController.updateTeam
);
router.delete(
  "/:teamId",
  authMiddleware,
  checkTeamOwnership,
  teamController.deleteTeam
);

router.get(
  "/:teamId/members",
  authMiddleware,
  checkTeamMembership,
  teamController.getTeamMembers
);
router.put(
  "/:teamId/members/:memberId/role",
  authMiddleware,
  checkTeamMembership,
  checkTeamPermission("canManageMembers"),
  teamController.updateMemberRole
);
router.delete(
  "/:teamId/members/:memberId",
  authMiddleware,
  checkTeamMembership,
  teamController.removeMember
);

router.get(
  "/:teamId/dashboard",
  authMiddleware,
  checkTeamMembership,
  teamController.getTeamDashboard
);

export default router;
