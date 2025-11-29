import { Response } from "express";
import { prisma } from "../db";
import { Prisma } from "@prisma/client";
import {
  validateUserProfile,
  validateUserProfileUpdate,
} from "../validators/userProfile.validator";
import { sendErrorResponse } from "../utils/errorResponse";
import { AuthRequest } from "../middleware/auth.middleware";
import { getAuth } from "../config/firebase";

export const createUserProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;

    const validationErrors = validateUserProfile({ ...req.body, userId });
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
      data: { ...req.body, userId },
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

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      include: {
        workExperiences: {
          orderBy: { displayOrder: "asc" },
        },
        education: {
          orderBy: { displayOrder: "asc" },
        },
        skills: {
          orderBy: { displayOrder: "asc" },
        },
        certifications: {
          orderBy: { issueDate: "desc" },
        },
        specialProjects: {
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
        "Not authorized to update this profile"
      );
      return;
    }

    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      sendErrorResponse(res, 404, "NOT_FOUND", "User profile not found");
      return;
    }

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

    const userProfile = await prisma.userProfile.update({
      where: { userId },
      data: req.body,
    });

    if (req.body.profilePhotoUrl !== undefined) {
      try {
        const firebaseAuth = getAuth();
        await firebaseAuth.updateUser(userId, {
          photoURL: req.body.profilePhotoUrl || undefined,
        });
      } catch (error) {
        // Non-critical, continue anyway
      }
    }

    res.json(userProfile);
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to update user profile"
    );
  }
};

export const deleteUserProfile = async (
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
        "Not authorized to delete this profile"
      );
      return;
    }

    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      sendErrorResponse(res, 404, "NOT_FOUND", "User profile not found");
      return;
    }

    await prisma.userProfile.delete({
      where: { userId },
    });
    res.status(204).send();
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to delete user profile"
    );
  }
};
