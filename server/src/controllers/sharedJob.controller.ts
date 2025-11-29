import { Response } from "express";
import { prisma } from "../db";
import { AuthRequest } from "../middleware/auth.middleware";
import { sendErrorResponse } from "../utils/errorResponse";
import {
  validateShareJob,
  validateJobComment,
} from "../validators/sharedJob.validator";
import { createTeamActivity } from "../services/teamActivity.service";

export const shareJob = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { teamId } = req.params;
    const validationErrors = validateShareJob(req.body);

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

    const { jobId, visibility } = req.body;

    const job = await prisma.jobOpportunity.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Job opportunity not found");
      return;
    }

    if (job.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "You can only share your own job opportunities"
      );
      return;
    }

    const existingShare = await prisma.sharedJobOpportunity.findFirst({
      where: { teamId, jobId },
    });

    if (existingShare) {
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "This job is already shared with the team"
      );
      return;
    }

    const sharedJob = await prisma.sharedJobOpportunity.create({
      data: {
        teamId,
        jobId,
        sharedBy: userId,
        visibility: visibility || "all_members",
      },
      include: {
        job: true,
        sharer: {
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
      activityType: "job_shared",
      entityType: "shared_job",
      entityId: sharedJob.id,
      metadata: {
        jobTitle: job.title,
        company: job.company,
      },
    });

    res.status(201).json(sharedJob);
  } catch (error) {
    console.error("Error sharing job:", error);
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to share job");
  }
};

export const getSharedJobs = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { teamId } = req.params;

    const sharedJobs = await prisma.sharedJobOpportunity.findMany({
      where: { teamId },
      include: {
        job: {
          include: {
            applicationHistory: {
              orderBy: { timestamp: "desc" },
              take: 1,
            },
          },
        },
        sharer: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
          },
        },
        comments: {
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
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { sharedAt: "desc" },
    });

    res.json(sharedJobs);
  } catch (error) {
    console.error("Error fetching shared jobs:", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch shared jobs"
    );
  }
};

export const getSharedJobById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { teamId, shareId } = req.params;

    const sharedJob = await prisma.sharedJobOpportunity.findUnique({
      where: { id: shareId },
      include: {
        job: {
          include: {
            applicationHistory: {
              orderBy: { timestamp: "desc" },
            },
            interviews: {
              orderBy: { scheduled_date: "desc" },
            },
          },
        },
        sharer: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
          },
        },
        comments: {
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
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!sharedJob || sharedJob.teamId !== teamId) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Shared job not found");
      return;
    }

    res.json(sharedJob);
  } catch (error) {
    console.error("Error fetching shared job:", error);
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to fetch shared job");
  }
};

export const unshareJob = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { teamId, shareId } = req.params;

    const sharedJob = await prisma.sharedJobOpportunity.findUnique({
      where: { id: shareId },
      include: { team: true },
    });

    if (!sharedJob || sharedJob.teamId !== teamId) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Shared job not found");
      return;
    }

    if (sharedJob.sharedBy !== userId && sharedJob.team.ownerId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Only the person who shared the job or the team owner can unshare it"
      );
      return;
    }

    await prisma.sharedJobOpportunity.delete({
      where: { id: shareId },
    });

    res.json({ message: "Job unshared successfully" });
  } catch (error) {
    console.error("Error unsharing job:", error);
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to unshare job");
  }
};

export const addComment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { shareId } = req.params;
    const validationErrors = validateJobComment(req.body);

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

    const { content, mentions } = req.body;

    const sharedJob = await prisma.sharedJobOpportunity.findUnique({
      where: { id: shareId },
    });

    if (!sharedJob) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Shared job not found");
      return;
    }

    const comment = await prisma.jobComment.create({
      data: {
        shareId,
        userId,
        content,
        mentions: mentions || [],
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
    });

    await createTeamActivity({
      teamId: sharedJob.teamId,
      userId,
      activityType: "comment_added",
      entityType: "job_comment",
      entityId: comment.id,
      metadata: {
        sharedJobId: shareId,
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error("Error adding comment:", error);
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to add comment");
  }
};

export const getComments = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { shareId } = req.params;

    const comments = await prisma.jobComment.findMany({
      where: { shareId },
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
      orderBy: { createdAt: "asc" },
    });

    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to fetch comments");
  }
};

export const updateComment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { commentId } = req.params;
    const validationErrors = validateJobComment(req.body);

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

    const { content, mentions } = req.body;

    const comment = await prisma.jobComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Comment not found");
      return;
    }

    if (comment.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "You can only edit your own comments"
      );
      return;
    }

    const updated = await prisma.jobComment.update({
      where: { id: commentId },
      data: { content, mentions },
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
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating comment:", error);
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to update comment");
  }
};

export const deleteComment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { commentId } = req.params;

    const comment = await prisma.jobComment.findUnique({
      where: { id: commentId },
      include: {
        sharedJob: {
          include: { team: true },
        },
      },
    });

    if (!comment) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Comment not found");
      return;
    }

    const isOwner = comment.userId === userId;
    const isTeamOwner = comment.sharedJob.team.ownerId === userId;

    if (!isOwner && !isTeamOwner) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "You can only delete your own comments or team owner can delete any comment"
      );
      return;
    }

    await prisma.jobComment.delete({
      where: { id: commentId },
    });

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to delete comment");
  }
};
