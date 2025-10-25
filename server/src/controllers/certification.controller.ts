import { Request, Response } from "express";
import { prisma } from "../db";
import { Prisma } from "@prisma/client";
import {
  validateCertification,
  validateCertificationUpdate,
} from "../validators/certification.validator";
import { sendErrorResponse } from "../utils/errorResponse";

export const createCertification = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validationErrors = validateCertification(req.body);
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
      data: req.body,
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
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const certification = await prisma.certification.findUnique({
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

    if (!certification) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Certification not found");
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
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
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
  req: Request,
  res: Response
): Promise<void> => {
  try {
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

    const { id } = req.params;
    const certification = await prisma.certification.update({
      where: { id },
      data: req.body,
    });
    res.json(certification);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        sendErrorResponse(res, 404, "NOT_FOUND", "Certification not found");
        return;
      }
    }
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to update certification"
    );
  }
};

export const deleteCertification = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.certification.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        sendErrorResponse(res, 404, "NOT_FOUND", "Certification not found");
        return;
      }
    }
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to delete certification"
    );
  }
};
