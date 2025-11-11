// controllers/jobOpportunity.controller.ts
import { Response } from "express";
import { prisma } from "../db";
import { Prisma } from "@prisma/client";
import {
  validateJobOpportunity,
  validateJobOpportunityUpdate,
} from "../validators/jobOpportunity.validator";
import { sendErrorResponse } from "../utils/errorResponse";
import { AuthRequest } from "../middleware/auth.middleware";

export const createJobOpportunity = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;

    const validationErrors = validateJobOpportunity({ ...req.body, userId });
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

    const jobOpportunity = await prisma.jobOpportunity.create({
      data: { ...req.body, userId },
    });
    res.status(201).json(jobOpportunity);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        sendErrorResponse(res, 404, "NOT_FOUND", "User profile not found");
        return;
      }
    }
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to create job opportunity"
    );
  }
};

export const getJobOpportunity = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const jobOpportunity = await prisma.jobOpportunity.findUnique({
      where: { id },
      include: {
        jobContacts: true,
        applicationHistory: {
          orderBy: { timestamp: "desc" },
        },
      },
    });

    if (!jobOpportunity) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Job opportunity not found");
      return;
    }

    if (jobOpportunity.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Not authorized to access this job opportunity"
      );
      return;
    }

    res.json(jobOpportunity);
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch job opportunity"
    );
  }
};

export const getJobOpportunitiesByUserId = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const authenticatedUserId = req.userId!;
    const { userId } = req.params;

    if (authenticatedUserId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Not authorized to access these job opportunities"
      );
      return;
    }

    const jobOpportunities = await prisma.jobOpportunity.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        jobContacts: true,
        applicationHistory: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
    });
    res.json(jobOpportunities);
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch job opportunities"
    );
  }
};

export const updateJobOpportunity = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const existingJob = await prisma.jobOpportunity.findUnique({
      where: { id },
    });

    if (!existingJob) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Job opportunity not found");
      return;
    }

    if (existingJob.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Not authorized to update this job opportunity"
      );
      return;
    }

    const validationErrors = validateJobOpportunityUpdate(req.body);
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

    const jobOpportunity = await prisma.jobOpportunity.update({
      where: { id },
      data: req.body,
    });
    res.json(jobOpportunity);
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to update job opportunity"
    );
  }
};

export const deleteJobOpportunity = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const existingJob = await prisma.jobOpportunity.findUnique({
      where: { id },
    });

    if (!existingJob) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Job opportunity not found");
      return;
    }

    if (existingJob.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Not authorized to delete this job opportunity"
      );
      return;
    }

    await prisma.jobOpportunity.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to delete job opportunity"
    );
  }
};

export const archiveJobOpportunity = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { reason } = req.body; // Optional archive reason

    const existingJob = await prisma.jobOpportunity.findUnique({
      where: { id },
    });

    if (!existingJob) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Job opportunity not found");
      return;
    }

    if (existingJob.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Not authorized to archive this job opportunity"
      );
      return;
    }

    if (existingJob.currentStatus === "archived") {
      sendErrorResponse(res, 400, "BAD_REQUEST", "Job is already archived");
      return;
    }

    // Archive the job
    const archivedJob = await prisma.$transaction(async (tx) => {
      const updated = await tx.jobOpportunity.update({
        where: { id },
        data: {
          currentStatus: "archived",
          archiveReason: reason || null,
          archivedAt: new Date(),
        },
      });

      await tx.applicationHistory.create({
        data: {
          jobId: id,
          status: "archived",
          notes: reason || "Job archived",
        },
      });

      return updated;
    });

    res.json(archivedJob);
  } catch (error) {
    console.error("Archive job error:", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to archive job opportunity"
    );
  }
};


export const bulkArchiveJobs = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { jobIds, reason } = req.body; // jobIds: string[], reason?: string

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "jobIds must be a non-empty array"
      );
      return;
    }

    // Verify all jobs belong to the user
    const jobs = await prisma.jobOpportunity.findMany({
      where: {
        id: { in: jobIds },
        userId: userId,
      },
    });

    if (jobs.length !== jobIds.length) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Some jobs not found or unauthorized"
      );
      return;
    }

    // Check if any are already archived
    const alreadyArchived = jobs.filter(j => j.currentStatus === "archived");
    if (alreadyArchived.length > 0) {
      sendErrorResponse(
        res,
        400,
        "BAD_REQUEST",
        `${alreadyArchived.length} job(s) already archived`
      );
      return;
    }

    // Bulk archive
    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();

      // Update all jobs
      await tx.jobOpportunity.updateMany({
        where: { id: { in: jobIds } },
        data: {
          currentStatus: "archived",
          archiveReason: reason || null,
          archivedAt: now,
        },
      });

      // Create history entries for each
      await tx.applicationHistory.createMany({
        data: jobIds.map(jobId => ({
          jobId,
          status: "archived" as const,
          notes: reason || "Bulk archived",
          timestamp: now,
        })),
      });

      return { archivedCount: jobIds.length };
    });

    res.json(result);
  } catch (error) {
    console.error("Bulk archive error:", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to archive jobs"
    );
  }
};

export const restoreJobOpportunity = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { restoreToStatus } = req.body; // Optional: which status to restore to

    const existingJob = await prisma.jobOpportunity.findUnique({
      where: { id },
      include: {
        applicationHistory: {
          orderBy: { timestamp: "desc" },
          take: 2, // Get current (archived) and previous status
        },
      },
    });

    if (!existingJob) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Job opportunity not found");
      return;
    }

    if (existingJob.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Not authorized to restore this job opportunity"
      );
      return;
    }

    if (existingJob.currentStatus !== "archived") {
      sendErrorResponse(res, 400, "BAD_REQUEST", "Job is not archived");
      return;
    }

    // Determine which status to restore to
    let targetStatus = restoreToStatus || "interested";
    
    // If no explicit restore status, use the previous status before archiving
    if (!restoreToStatus && existingJob.applicationHistory.length >= 2) {
      targetStatus = existingJob.applicationHistory[1].status;
    }

    // Restore the job
    const restoredJob = await prisma.$transaction(async (tx) => {
      const updated = await tx.jobOpportunity.update({
        where: { id },
        data: {
          currentStatus: targetStatus,
          archiveReason: null,
          archivedAt: null,
        },
      });

      await tx.applicationHistory.create({
        data: {
          jobId: id,
          status: targetStatus,
          notes: `Restored from archive to ${targetStatus}`,
        },
      });

      return updated;
    });

    res.json(restoredJob);
  } catch (error) {
    console.error("Restore job error:", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to restore job opportunity"
    );
  }
};

export const getArchivedJobs = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;

    const archivedJobs = await prisma.jobOpportunity.findMany({
      where: {
        userId,
        currentStatus: "archived",
      },
      orderBy: { archivedAt: "desc" },
      include: {
        jobContacts: true,
        applicationHistory: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
    });

    res.json(archivedJobs);
  } catch (error) {
    console.error("Get archived jobs error:", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch archived jobs"
    );
  }
};

export const permanentlyDeleteJob = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { confirmDelete } = req.body; // Require explicit confirmation

    if (confirmDelete !== true) {
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Confirmation required for permanent deletion"
      );
      return;
    }

    const existingJob = await prisma.jobOpportunity.findUnique({
      where: { id },
    });

    if (!existingJob) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Job opportunity not found");
      return;
    }

    if (existingJob.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Not authorized to delete this job opportunity"
      );
      return;
    }

    // Permanently delete (cascades to related records)
    await prisma.jobOpportunity.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Permanent delete error:", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to delete job opportunity"
    );
  }
};