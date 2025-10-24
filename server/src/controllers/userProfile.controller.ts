import { Request, Response } from "express";
import { prisma } from "../db";
import { Prisma } from "@prisma/client";
import {
  validateUserProfile,
  validateUserProfileUpdate,
} from "../validators/userProfile.validator";
import { sendErrorResponse } from "../utils/errorResponse";

export const createUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validationErrors = validateUserProfile(req.body);
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

    const userProfile = await prisma.userProfile.create({
      data: req.body,
    });
    res.status(201).json(userProfile);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        sendErrorResponse(
          res,
          409,
          "DUPLICATE_ENTRY",
          "A profile with this user ID already exists"
        );
        return;
      }
    }
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to create user profile"
    );
  }
};

export const getUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userProfile = await prisma.userProfile.findUnique({
      where: { id },
      include: {
        workExperiences: {
          orderBy: { displayOrder: "asc" },
        },
        education: {
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    if (!userProfile) {
      sendErrorResponse(res, 404, "NOT_FOUND", "User profile not found");
      return;
    }

    res.json(userProfile);
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch user profile"
    );
  }
};

export const getUserProfileByUserId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      include: {
        workExperiences: {
          orderBy: { displayOrder: "asc" },
        },
        education: {
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    if (!userProfile) {
      sendErrorResponse(res, 404, "NOT_FOUND", "User profile not found");
      return;
    }

    res.json(userProfile);
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch user profile"
    );
  }
};

export const updateUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validationErrors = validateUserProfileUpdate(req.body);
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
    const userProfile = await prisma.userProfile.update({
      where: { id },
      data: req.body,
    });
    res.json(userProfile);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        sendErrorResponse(res, 404, "NOT_FOUND", "User profile not found");
        return;
      }
    }
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to update user profile"
    );
  }
};

export const deleteUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.userProfile.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        sendErrorResponse(res, 404, "NOT_FOUND", "User profile not found");
        return;
      }
    }
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to delete user profile"
    );
  }
};

export const listUserProfiles = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { limit = "10", offset = "0" } = req.query;
    const userProfiles = await prisma.userProfile.findMany({
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      orderBy: { createdAt: "desc" },
    });
    res.json(userProfiles);
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch user profiles"
    );
  }
};
