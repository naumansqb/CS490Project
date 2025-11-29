import { Response } from "express";
import { prisma } from "../db";
import { AuthRequest } from "../middleware/auth.middleware";
import { sendErrorResponse } from "../utils/errorResponse";
import { validateTeamFeedback } from "../validators/teamFeedback.validator";
import { createTeamActivity } from "../services/teamActivity.service";
import { calculateMenteeProgress } from "../services/teamAnalytics.service";

export const getMentees = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { teamId } = req.params;

    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
        isActive: true,
      },
    });

    if (!membership || !["owner", "mentor", "coach"].includes(membership.role)) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Only mentors and coaches can view mentees"
      );
      return;
    }

    const mentees = await prisma.teamMember.findMany({
      where: {
        teamId,
        isActive: true,
        role: "member",
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

    res.json(mentees);
  } catch (error) {
    console.error("Error fetching mentees:", error);
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to fetch mentees");
  }
};

export const getMenteeProgress = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const requesterId = req.userId!;
    const { teamId, userId } = req.params;

    const isSelf = requesterId === userId;

    if (!isSelf) {
      const requesterMembership = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userId: requesterId,
          isActive: true,
        },
      });

      if (
        !requesterMembership ||
        !["owner", "mentor", "coach"].includes(requesterMembership.role)
      ) {
        sendErrorResponse(
          res,
          403,
          "FORBIDDEN",
          "You do not have permission to view this member's progress"
        );
        return;
      }
    }

    const progress = await calculateMenteeProgress(teamId, userId);

    res.json(progress);
  } catch (error) {
    console.error("Error fetching mentee progress:", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch mentee progress"
    );
  }
};

export const createFeedback = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { teamId } = req.params;
    const validationErrors = validateTeamFeedback(req.body);

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

    const {
      menteeId,
      feedbackType,
      content,
      relatedEntityType,
      relatedEntityId,
    } = req.body;

    const menteeMembership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: menteeId,
        isActive: true,
      },
    });

    if (!menteeMembership) {
      sendErrorResponse(
        res,
        404,
        "NOT_FOUND",
        "Mentee is not a member of this team"
      );
      return;
    }

    const feedback = await prisma.teamFeedback.create({
      data: {
        teamId,
        menteeId,
        mentorId: userId,
        feedbackType,
        content,
        relatedEntityType,
        relatedEntityId,
      },
      include: {
        mentee: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        mentor: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    await createTeamActivity({
      teamId,
      userId,
      activityType: "feedback_given",
      entityType: "team_feedback",
      entityId: feedback.id,
      metadata: {
        feedbackType,
        menteeId,
      },
    });

    res.status(201).json(feedback);
  } catch (error) {
    console.error("Error creating feedback:", error);
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to create feedback");
  }
};

export const getFeedbackForMentee = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const requesterId = req.userId!;
    const { teamId, userId } = req.params;

    const isSelf = requesterId === userId;

    if (!isSelf) {
      const requesterMembership = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userId: requesterId,
          isActive: true,
        },
      });

      if (
        !requesterMembership ||
        !["owner", "mentor", "coach"].includes(requesterMembership.role)
      ) {
        sendErrorResponse(
          res,
          403,
          "FORBIDDEN",
          "You do not have permission to view this feedback"
        );
        return;
      }
    }

    const feedback = await prisma.teamFeedback.findMany({
      where: {
        teamId,
        menteeId: userId,
      },
      include: {
        mentor: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(feedback);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to fetch feedback");
  }
};

export const getAllFeedback = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { teamId } = req.params;
    const { feedbackType, menteeId } = req.query;

    const where: any = { teamId };

    if (feedbackType) {
      where.feedbackType = feedbackType;
    }

    if (menteeId) {
      where.menteeId = menteeId;
    }

    const feedback = await prisma.teamFeedback.findMany({
      where,
      include: {
        mentee: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
          },
        },
        mentor: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(feedback);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to fetch feedback");
  }
};
