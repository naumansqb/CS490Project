// controllers/applicationHistory.controller.ts
import { Response } from "express";
import { prisma } from "../db";
import { Prisma } from "@prisma/client";
import {
  validateApplicationHistory,
  validateApplicationHistoryUpdate,
} from "../validators/applicationHistory.validator";
import { sendErrorResponse } from "../utils/errorResponse";
import { AuthRequest } from "../middleware/auth.middleware";

export const createApplicationHistory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { jobId } = req.body;

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
        "Not authorized to add history to this job"
      );
      return;
    }

    const validationErrors = validateApplicationHistory(req.body);
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

    const applicationHistory = await prisma.applicationHistory.create({
      data: req.body,
    });
    res.status(201).json(applicationHistory);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        sendErrorResponse(res, 404, "NOT_FOUND", "Job opportunity not found");
        return;
      }
    }
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to create application history"
    );
  }
};

export const getApplicationHistory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const applicationHistory = await prisma.applicationHistory.findUnique({
      where: { id },
      include: {
        jobOpportunity: true,
      },
    });

    if (!applicationHistory) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Application history not found");
      return;
    }

    if (applicationHistory.jobOpportunity.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Not authorized to access this application history"
      );
      return;
    }

    res.json(applicationHistory);
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch application history"
    );
  }
};

export const getApplicationHistoryByJobId = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { jobId } = req.params;

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
        "Not authorized to access this application history"
      );
      return;
    }

    const applicationHistory = await prisma.applicationHistory.findMany({
      where: { jobId },
      orderBy: { timestamp: "desc" },
    });
    res.json(applicationHistory);
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch application history"
    );
  }
};

export const updateApplicationHistory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const existingHistory = await prisma.applicationHistory.findUnique({
      where: { id },
      include: {
        jobOpportunity: true,
      },
    });

    if (!existingHistory) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Application history not found");
      return;
    }

    if (existingHistory.jobOpportunity.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Not authorized to update this application history"
      );
      return;
    }

    const validationErrors = validateApplicationHistoryUpdate(req.body);
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

    const applicationHistory = await prisma.applicationHistory.update({
      where: { id },
      data: req.body,
    });
    res.json(applicationHistory);
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to update application history"
    );
  }
};

export const deleteApplicationHistory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const existingHistory = await prisma.applicationHistory.findUnique({
      where: { id },
      include: {
        jobOpportunity: true,
      },
    });

    if (!existingHistory) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Application history not found");
      return;
    }

    if (existingHistory.jobOpportunity.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Not authorized to delete this application history"
      );
      return;
    }

    await prisma.applicationHistory.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to delete application history"
    );
  }
};
