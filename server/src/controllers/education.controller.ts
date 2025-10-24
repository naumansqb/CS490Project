import { Request, Response } from "express";
import { prisma } from "../db";
import { Prisma } from "@prisma/client";
import {
  validateEducation,
  validateEducationUpdate,
} from "../validators/education.validator";
import { sendErrorResponse } from "../utils/errorResponse";

export const createEducation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validationErrors = validateEducation(req.body);
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
      data: req.body,
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
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const education = await prisma.education.findUnique({
      where: { id },
      include: {
        userProfile: {
          select: {
            id: true,
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

    res.json(education);
  } catch (error) {
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to fetch education");
  }
};

export const getEducationsByUserId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
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
  req: Request,
  res: Response
): Promise<void> => {
  try {
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

    const { id } = req.params;
    const education = await prisma.education.update({
      where: { id },
      data: req.body,
    });
    res.json(education);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        sendErrorResponse(res, 404, "NOT_FOUND", "Education not found");
        return;
      }
    }
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to update education");
  }
};

export const deleteEducation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.education.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        sendErrorResponse(res, 404, "NOT_FOUND", "Education not found");
        return;
      }
    }
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to delete education");
  }
};
