import { Response } from "express";
import { prisma } from "../db";
import { Prisma } from "@prisma/client";
import {
  validateCertification,
  validateCertificationUpdate,
} from "../validators/certification.validator";
import { sendErrorResponse } from "../utils/errorResponse";
import { AuthRequest } from "../middleware/auth.middleware";

export const createCertification = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;

    const validationErrors = validateCertification({ ...req.body, userId });
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

    const certification = await prisma.certification.create({
      data: { ...req.body, userId },
    });
    res.status(201).json(certification);
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
      "Failed to create certification"
    );
  }
};

export const getCertification = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const certification = await prisma.certification.findUnique({
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

    if (!certification) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Certification not found");
      return;
    }

    if (certification.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Not authorized to access this certification"
      );
      return;
    }

    res.json(certification);
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch certification"
    );
  }
};

export const getCertificationsByUserId = async (
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
        "Not authorized to access these certifications"
      );
      return;
    }

    const certifications = await prisma.certification.findMany({
      where: { userId },
      orderBy: { issueDate: "desc" },
    });
    res.json(certifications);
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch certifications"
    );
  }
};

export const updateCertification = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const existingCertification = await prisma.certification.findUnique({
      where: { id },
    });

    if (!existingCertification) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Certification not found");
      return;
    }

    if (existingCertification.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Not authorized to update this certification"
      );
      return;
    }

    const validationErrors = validateCertificationUpdate(req.body);
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

    const certification = await prisma.certification.update({
      where: { id },
      data: req.body,
    });
    res.json(certification);
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to update certification"
    );
  }
};

export const deleteCertification = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const existingCertification = await prisma.certification.findUnique({
      where: { id },
    });

    if (!existingCertification) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Certification not found");
      return;
    }

    if (existingCertification.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Not authorized to delete this certification"
      );
      return;
    }

    await prisma.certification.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to delete certification"
    );
  }
};
