import { Response } from "express";
import { prisma } from "../db";
import { Prisma } from "@prisma/client";
import {
  validateWorkExperience,
  validateWorkExperienceUpdate,
} from "../validators/workExperience.validator";
import { sendErrorResponse } from "../utils/errorResponse";
import { AuthRequest } from "../middleware/auth.middleware";

export const createWorkExperience = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;

    const validationErrors = validateWorkExperience({ ...req.body, userId });
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

    const workExperience = await prisma.workExperience.create({
      data: { ...req.body, userId },
    });
    res.status(201).json(workExperience);
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
      "Failed to create work experience"
    );
  }
};

export const getWorkExperience = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const workExperience = await prisma.workExperience.findUnique({
      where: { id },
      include: {
        userProfile: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!workExperience) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Work experience not found");
      return;
    }

    if (workExperience.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Not authorized to access this work experience"
      );
      return;
    }

    res.json(workExperience);
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch work experience"
    );
  }
};

export const getWorkExperiencesByUserId = async (
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
        "Not authorized to access these work experiences"
      );
      return;
    }

    const workExperiences = await prisma.workExperience.findMany({
      where: { userId },
      orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }],
    });
    res.json(workExperiences);
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch work experiences"
    );
  }
};

export const updateWorkExperience = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const existingWorkExperience = await prisma.workExperience.findUnique({
      where: { id },
    });

    if (!existingWorkExperience) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Work experience not found");
      return;
    }

    if (existingWorkExperience.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Not authorized to update this work experience"
      );
      return;
    }

    const validationErrors = validateWorkExperienceUpdate(req.body);
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

    const workExperience = await prisma.workExperience.update({
      where: { id },
      data: req.body,
    });
    res.json(workExperience);
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to update work experience"
    );
  }
};

export const deleteWorkExperience = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const existingWorkExperience = await prisma.workExperience.findUnique({
      where: { id },
    });

    if (!existingWorkExperience) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Work experience not found");
      return;
    }

    if (existingWorkExperience.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Not authorized to delete this work experience"
      );
      return;
    }

    await prisma.workExperience.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to delete work experience"
    );
  }
};
