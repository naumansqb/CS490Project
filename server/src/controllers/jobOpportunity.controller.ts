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
