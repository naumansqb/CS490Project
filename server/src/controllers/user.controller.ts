import { Request, Response } from 'express';
import { prisma } from "../db";
import { sendErrorResponse } from "../utils/errorResponse";
import { AuthRequest } from "../middleware/auth.middleware";
import { validateUserProfileUpdate } from "../validators/userProfile.validator";
import { sendAccountDeletionEmail } from '../services/email';
import { getAuth } from "../config/firebase";


export const getCurrentUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      sendErrorResponse(res, 401, "UNAUTHORIZED", "Authentication required");
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

    res.status(200).json(userProfile);
  } catch (error) {
    console.error("[Get Current User Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch user profile"
    );
  }
};

export const updateCurrentUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      sendErrorResponse(res, 401, "UNAUTHORIZED", "Authentication required");
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

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!userProfile) {
      sendErrorResponse(res, 404, "NOT_FOUND", "User profile not found");
      return;
    }

    const updatedProfile = await prisma.userProfile.update({
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

    res.status(200).json(updatedProfile);
  } catch (error) {
    console.error("[Update Current User Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to update user profile"
    );
  }
};

/**
 * Delete user account and all associated data
 */
export const deleteUserAccount = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      sendErrorResponse(res, 401, "UNAUTHORIZED", "Authentication required");
      return;
    }

    // Delete user profile and all related data
    try {
      await prisma.userProfile.delete({
        where: { userId },
      });
    } catch (error: any) {
      if (error.code !== 'P2025') { // P2025 = record not found
        throw error;
      }
    }

    // Delete Firebase user
    try {
      const firebaseAuth = getAuth();
      await firebaseAuth.deleteUser(userId);
    } catch (error: any) {
      console.error("[Firebase Delete User Error]", error);
      // Continue even if Firebase deletion fails - database is already cleaned
    }

    res.status(200).json({
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("[Delete User Account Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to delete user account"
    );
  }
};

/**
 * Send account deletion confirmation email
 */
export async function sendDeletionEmail(req: Request, res: Response) {
  try {
    const { email, userName } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    await sendAccountDeletionEmail(email, userName || 'User');

    res.status(200).json({
      success: true,
      message: 'Deletion confirmation email sent'
    });
  } catch (error) {
    console.error('Send deletion email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send email'
    });
  }
}
