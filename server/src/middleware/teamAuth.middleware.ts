import { Response, NextFunction } from "express";
import { prisma } from "../db";
import { sendErrorResponse } from "../utils/errorResponse";
import { AuthRequest } from "./auth.middleware";
import { RolePermissions } from "../types/team.types";

export const checkTeamMembership = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { teamId } = req.params;

    if (!teamId) {
      sendErrorResponse(res, 400, "VALIDATION_ERROR", "Team ID is required");
      return;
    }

    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
        isActive: true,
      },
      include: {
        team: true,
      },
    });

    if (!membership) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "You are not a member of this team"
      );
      return;
    }

    if (!membership.team.isActive) {
      sendErrorResponse(res, 403, "FORBIDDEN", "This team is inactive");
      return;
    }

    (req as any).teamMembership = membership;
    next();
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to verify team membership"
    );
  }
};

export const checkTeamPermission = (requiredPermission: keyof typeof RolePermissions.owner) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const membership = (req as any).teamMembership;

      if (!membership) {
        sendErrorResponse(
          res,
          403,
          "FORBIDDEN",
          "Team membership not verified"
        );
        return;
      }

      const permissions = RolePermissions[membership.role as keyof typeof RolePermissions];

      if (!permissions || !permissions[requiredPermission]) {
        sendErrorResponse(
          res,
          403,
          "FORBIDDEN",
          `You do not have permission to perform this action. Required permission: ${requiredPermission}`
        );
        return;
      }

      next();
    } catch (error) {
      sendErrorResponse(
        res,
        500,
        "INTERNAL_ERROR",
        "Failed to verify permissions"
      );
    }
  };
};

export const checkTeamOwnership = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { teamId } = req.params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Team not found");
      return;
    }

    if (team.ownerId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Only the team owner can perform this action"
      );
      return;
    }

    next();
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to verify team ownership"
    );
  }
};

export const checkMentorOrCoachRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const membership = (req as any).teamMembership;

    if (!membership) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Team membership not verified"
      );
      return;
    }

    const allowedRoles = ["owner", "mentor", "coach"];
    if (!allowedRoles.includes(membership.role)) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "This action requires mentor or coach role"
      );
      return;
    }

    next();
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to verify role"
    );
  }
};
