import { Response } from "express";
import { prisma } from "../db";
import { AuthRequest } from "../middleware/auth.middleware";
import { sendErrorResponse } from "../utils/errorResponse";
import {
  validateTeam,
  validateTeamUpdate,
  validateMemberRoleUpdate,
} from "../validators/team.validator";
import { calculateTeamDashboard } from "../services/teamAnalytics.service";
import { createTeamActivity } from "../services/teamActivity.service";

export const createTeam = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const validationErrors = validateTeam(req.body);

    if (validationErrors.length > 0) {
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Invalid input data",
        validationErrors
      );
      return;
    }

    const { name, description, type, maxMembers } = req.body;

    const team = await prisma.team.create({
      data: {
        name,
        description,
        type: type || "job_search_group",
        ownerId: userId,
        maxMembers,
      },
      include: {
        owner: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId,
        role: "owner",
      },
    });

    await createTeamActivity({
      teamId: team.id,
      userId,
      activityType: "team_created",
      entityType: "team",
      entityId: team.id,
      metadata: { teamName: team.name },
    });

    res.status(201).json(team);
  } catch (error) {
    console.error("Error creating team:", error);
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to create team");
  }
};

export const getMyTeams = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;

    const memberships = await prisma.teamMember.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        team: {
          include: {
            owner: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            members: {
              where: { isActive: true },
              select: { id: true },
            },
          },
        },
      },
      orderBy: {
        joinedAt: "desc",
      },
    });

    const teams = memberships.map((m) => ({
      ...m.team,
      myRole: m.role,
      memberCount: m.team.members.length,
    }));

    res.json(teams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to fetch teams");
  }
};

export const getTeamById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { teamId } = req.params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        owner: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
                email: true,
                profilePhotoUrl: true,
              },
            },
          },
        },
      },
    });

    if (!team) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Team not found");
      return;
    }

    res.json(team);
  } catch (error) {
    console.error("Error fetching team:", error);
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to fetch team");
  }
};

export const updateTeam = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { teamId } = req.params;
    const validationErrors = validateTeamUpdate(req.body);

    if (validationErrors.length > 0) {
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Invalid input data",
        validationErrors
      );
      return;
    }

    const { name, description, type, maxMembers, isActive } = req.body;

    const team = await prisma.team.update({
      where: { id: teamId },
      data: {
        name,
        description,
        type,
        maxMembers,
        isActive,
      },
    });

    res.json(team);
  } catch (error) {
    console.error("Error updating team:", error);
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to update team");
  }
};

export const deleteTeam = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { teamId } = req.params;

    await prisma.team.delete({
      where: { id: teamId },
    });

    res.json({ message: "Team deleted successfully" });
  } catch (error) {
    console.error("Error deleting team:", error);
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to delete team");
  }
};

export const getTeamMembers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { teamId } = req.params;

    const members = await prisma.teamMember.findMany({
      where: {
        teamId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePhotoUrl: true,
            headline: true,
          },
        },
      },
      orderBy: {
        joinedAt: "asc",
      },
    });

    res.json(members);
  } catch (error) {
    console.error("Error fetching team members:", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch team members"
    );
  }
};

export const updateMemberRole = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { teamId, memberId } = req.params;
    const validationErrors = validateMemberRoleUpdate(req.body);

    if (validationErrors.length > 0) {
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Invalid input data",
        validationErrors
      );
      return;
    }

    const { role } = req.body;

    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.teamId !== teamId) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Team member not found");
      return;
    }

    if (member.role === "owner") {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Cannot change the role of the team owner"
      );
      return;
    }

    const updated = await prisma.teamMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating member role:", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to update member role"
    );
  }
};

export const removeMember = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { teamId, memberId } = req.params;

    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
      include: { team: true },
    });

    if (!member || member.teamId !== teamId) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Team member not found");
      return;
    }

    if (member.team.ownerId === member.userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Cannot remove the team owner"
      );
      return;
    }

    const isSelf = member.userId === userId;
    if (!isSelf) {
      const requesterMember = await prisma.teamMember.findFirst({
        where: { teamId, userId },
      });

      if (
        !requesterMember ||
        !["owner", "mentor"].includes(requesterMember.role)
      ) {
        sendErrorResponse(
          res,
          403,
          "FORBIDDEN",
          "Only owners and mentors can remove members"
        );
        return;
      }
    }

    await prisma.teamMember.update({
      where: { id: memberId },
      data: { isActive: false },
    });

    await createTeamActivity({
      teamId,
      userId: member.userId,
      activityType: "member_left",
      entityType: "team_member",
      entityId: memberId,
    });

    res.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Error removing member:", error);
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to remove member");
  }
};

export const getTeamDashboard = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { teamId } = req.params;

    const dashboard = await calculateTeamDashboard(teamId);

    res.json(dashboard);
  } catch (error) {
    console.error("Error fetching team dashboard:", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch team dashboard"
    );
  }
};
