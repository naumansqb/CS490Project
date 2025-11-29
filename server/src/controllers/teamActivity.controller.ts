import { Response } from "express";
import { prisma } from "../db";
import { AuthRequest } from "../middleware/auth.middleware";
import { sendErrorResponse } from "../utils/errorResponse";
import { getActivityDescription } from "../services/teamActivity.service";

export const getActivityFeed = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { teamId } = req.params;
    const { limit = "50", offset = "0" } = req.query;

    const activities = await prisma.teamActivity.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const membership = await prisma.teamMember.findFirst({
      where: { teamId, userId: activities[0]?.userId },
    });

    const enrichedActivities = activities.map((activity) => {
      const userName = `${activity.user.firstName || ""} ${activity.user.lastName || ""}`.trim() || "Unknown User";

      return {
        id: activity.id,
        teamId: activity.teamId,
        userId: activity.userId,
        userName,
        userRole: membership?.role || "member",
        userPhoto: activity.user.profilePhotoUrl,
        activityType: activity.activityType,
        description: getActivityDescription(
          activity.activityType,
          userName,
          activity.metadata as any
        ),
        entityType: activity.entityType,
        entityId: activity.entityId,
        metadata: activity.metadata,
        createdAt: activity.createdAt,
      };
    });

    res.json(enrichedActivities);
  } catch (error) {
    console.error("Error fetching activity feed:", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch activity feed"
    );
  }
};

export const getMilestones = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { teamId } = req.params;

    const milestones = await prisma.teamActivity.findMany({
      where: {
        teamId,
        activityType: "milestone_reached",
      },
      include: {
        user: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const enrichedMilestones = milestones.map((m) => ({
      id: m.id,
      type: m.activityType,
      description: (m.metadata as any)?.milestone || "Milestone achieved",
      achievedBy: m.userId,
      achievedByName: `${m.user.firstName || ""} ${m.user.lastName || ""}`.trim(),
      achievedByPhoto: m.user.profilePhotoUrl,
      achievedAt: m.createdAt,
      metadata: m.metadata,
    }));

    res.json(enrichedMilestones);
  } catch (error) {
    console.error("Error fetching milestones:", error);
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to fetch milestones");
  }
};
