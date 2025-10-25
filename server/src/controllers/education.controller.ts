import { Request, Response } from "express";
import { prisma } from "../db";
import { Prisma } from "@prisma/client";
import {
  validateEducation,
  validateEducationUpdate,
} from "../validators/education.validator";
import { sendErrorResponse } from "../utils/errorResponse";
import { AuthRequest } from "../middleware/auth.middleware";

export const createEducation = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;

    const validationErrors = validateEducation({ ...req.body, userId });
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

    const education = await prisma.education.create({
      data: { ...req.body, userId },
    });
    res.status(201).json(education);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        sendErrorResponse(res, 404, "NOT_FOUND", "User profile not found");
        return;
      }
    }
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to create education");
  }
};

export const getEducation = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const education = await prisma.education.findUnique({
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

    if (!education) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Education not found");
      return;
    }

    if (education.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Not authorized to access this education"
      );
      return;
    }

    res.json(education);
  } catch (error) {
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to fetch education");
  }
};

export const getEducationsByUserId = async (
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
        "Not authorized to access this profile"
      );
      return;
    }

    const educations = await prisma.education.findMany({
      where: { userId },
      orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }],
    });
    res.json(educations);
  } catch (error) {
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to fetch educations");
  }
};

export const updateEducation = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const existingEducation = await prisma.education.findUnique({
      where: { id },
    });

    if (!existingEducation) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Education not found");
      return;
    }

    if (existingEducation.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Not authorized to update this education"
      );
      return;
    }

    const validationErrors = validateEducationUpdate(req.body);
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

    const education = await prisma.education.update({
      where: { id },
      data: req.body,
    });
    res.json(education);
  } catch (error) {
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to update education");
  }
};

export const deleteEducation = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const existingEducation = await prisma.education.findUnique({
      where: { id },
    });

    if (!existingEducation) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Education not found");
      return;
    }

    if (existingEducation.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Not authorized to delete this education"
      );
      return;
    }

    await prisma.education.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to delete education");
  }
};
