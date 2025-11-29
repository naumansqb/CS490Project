import { Router } from "express";
import * as teamInvitationController from "../controllers/teamInvitation.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  checkTeamMembership,
  checkTeamPermission,
} from "../middleware/teamAuth.middleware";

const router = Router();

router.post(
  "/:teamId/invitations",
  authMiddleware,
  checkTeamMembership,
  checkTeamPermission("canManageMembers"),
  teamInvitationController.createInvitation
);

router.get(
  "/:teamId/invitations",
  authMiddleware,
  checkTeamMembership,
  checkTeamPermission("canManageMembers"),
  teamInvitationController.getTeamInvitations
);

router.delete(
  "/:teamId/invitations/:inviteId",
  authMiddleware,
  checkTeamMembership,
  checkTeamPermission("canManageMembers"),
  teamInvitationController.cancelInvitation
);

router.get(
  "/my-invitations",
  authMiddleware,
  teamInvitationController.getMyInvitations
);

router.post(
  "/:inviteId/accept",
  authMiddleware,
  teamInvitationController.acceptInvitation
);

router.post(
  "/:inviteId/decline",
  authMiddleware,
  teamInvitationController.declineInvitation
);

export default router;
