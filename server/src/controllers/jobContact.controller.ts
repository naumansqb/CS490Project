// controllers/jobContact.controller.ts
import { Response } from "express";
import { prisma } from "../db";
import { Prisma } from "@prisma/client";
import {
  validateJobContact,
  validateJobContactUpdate,
} from "../validators/jobContact.validator";
import { sendErrorResponse } from "../utils/errorResponse";
import { AuthRequest } from "../middleware/auth.middleware";

export const createJobContact = async (
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
        "Not authorized to add contacts to this job"
      );
      return;
    }

    const validationErrors = validateJobContact(req.body);
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

    const jobContact = await prisma.jobContact.create({
      data: req.body,
    });
    res.status(201).json(jobContact);
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
      "Failed to create job contact"
    );
  }
};

export const getJobContact = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const jobContact = await prisma.jobContact.findUnique({
      where: { id },
      include: {
        jobOpportunity: true,
      },
    });

    if (!jobContact) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Job contact not found");
      return;
    }

    if (jobContact.jobOpportunity.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Not authorized to access this job contact"
      );
      return;
    }

    res.json(jobContact);
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch job contact"
    );
  }
};

export const getJobContactsByJobId = async (
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
        "Not authorized to access these contacts"
      );
      return;
    }

    const jobContacts = await prisma.jobContact.findMany({
      where: { jobId },
      orderBy: { createdAt: "asc" },
    });
    res.json(jobContacts);
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch job contacts"
    );
  }
};

export const updateJobContact = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const existingContact = await prisma.jobContact.findUnique({
      where: { id },
      include: {
        jobOpportunity: true,
      },
    });

    if (!existingContact) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Job contact not found");
      return;
    }

    if (existingContact.jobOpportunity.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Not authorized to update this job contact"
      );
      return;
    }

    const validationErrors = validateJobContactUpdate(req.body);
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

    const jobContact = await prisma.jobContact.update({
      where: { id },
      data: req.body,
    });
    res.json(jobContact);
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to update job contact"
    );
  }
};

export const deleteJobContact = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const existingContact = await prisma.jobContact.findUnique({
      where: { id },
      include: {
        jobOpportunity: true,
      },
    });

    if (!existingContact) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Job contact not found");
      return;
    }

    if (existingContact.jobOpportunity.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Not authorized to delete this job contact"
      );
      return;
    }

    await prisma.jobContact.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to delete job contact"
    );
  }
};
