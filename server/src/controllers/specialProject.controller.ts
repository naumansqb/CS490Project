import { Request, Response } from "express";
import { prisma } from "../db";
import { Prisma } from "@prisma/client";
import {
  validateSpecialProject,
  validateSpecialProjectUpdate,
} from "../validators/specialProject.validator";
import { sendErrorResponse } from "../utils/errorResponse";

export const createSpecialProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validationErrors = validateSpecialProject(req.body);
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

    const specialProject = await prisma.specialProject.create({
      data: req.body,
    });
    res.status(201).json(specialProject);
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
      "Failed to create special project"
    );
  }
};

export const getSpecialProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const specialProject = await prisma.specialProject.findUnique({
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

    if (!specialProject) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Special project not found");
      return;
    }

    res.json(specialProject);
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch special project"
    );
  }
};

export const getSpecialProjectsByUserId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const specialProjects = await prisma.specialProject.findMany({
      where,
      orderBy: [{ startDate: "desc" }],
    });
    res.json(specialProjects);
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch special projects"
    );
  }
};

export const updateSpecialProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validationErrors = validateSpecialProjectUpdate(req.body);
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
    const specialProject = await prisma.specialProject.update({
      where: { id },
      data: req.body,
    });
    res.json(specialProject);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        sendErrorResponse(res, 404, "NOT_FOUND", "Special project not found");
        return;
      }
    }
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to update special project"
    );
  }
};

export const deleteSpecialProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.specialProject.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        sendErrorResponse(res, 404, "NOT_FOUND", "Special project not found");
        return;
      }
    }
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to delete special project"
    );
  }
};
