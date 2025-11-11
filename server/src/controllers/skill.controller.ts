import { Response } from "express";
import { prisma } from "../db";
import { Prisma } from "@prisma/client";
import {
  validateSkill,
  validateSkillUpdate,
} from "../validators/skill.validator";
import { sendErrorResponse } from "../utils/errorResponse";
import { AuthRequest } from "../middleware/auth.middleware";

export const createSkill = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;

    const validationErrors = validateSkill({ ...req.body, userId });
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

    const skill = await prisma.skill.create({
      data: { ...req.body, userId },
    });

    // Invalidate skills gap analysis cache when skills change
    // Delete the analyses so they will be regenerated with updated skills
    // This prevents creating history snapshots with stale data
    await prisma.skills_gap_analysis.deleteMany({
      where: { user_id: userId },
    });

    res.status(201).json(skill);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        sendErrorResponse(
          res,
          409,
          "DUPLICATE_ENTRY",
          "A skill with this name already exists for this user"
        );
        return;
      }
      if (error.code === "P2003") {
        sendErrorResponse(res, 404, "NOT_FOUND", "User profile not found");
        return;
      }
    }
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to create skill");
  }
};

export const getSkill = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const skill = await prisma.skill.findUnique({
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

    if (!skill) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Skill not found");
      return;
    }

    if (skill.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Not authorized to access this skill"
      );
      return;
    }

    res.json(skill);
  } catch (error) {
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to fetch skill");
  }
};

export const getSkillsByUserId = async (
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
        "Not authorized to access these skills"
      );
      return;
    }

    const { category } = req.query;
    const where: any = { userId };
    if (category) {
      where.skillCategory = category;
    }

    const skills = await prisma.skill.findMany({
      where,
      orderBy: { displayOrder: "asc" },
    });
    res.json(skills);
  } catch (error) {
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to fetch skills");
  }
};

export const updateSkill = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const existingSkill = await prisma.skill.findUnique({
      where: { id },
    });

    if (!existingSkill) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Skill not found");
      return;
    }

    if (existingSkill.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Not authorized to update this skill"
      );
      return;
    }

    const validationErrors = validateSkillUpdate(req.body);
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

    const skill = await prisma.skill.update({
      where: { id },
      data: req.body,
    });

    // Invalidate skills gap analysis cache when skills change
    // Delete the analyses so they will be regenerated with updated skills
    // This prevents creating history snapshots with stale data
    await prisma.skills_gap_analysis.deleteMany({
      where: { user_id: userId },
    });

    res.json(skill);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        sendErrorResponse(
          res,
          409,
          "DUPLICATE_ENTRY",
          "A skill with this name already exists for this user"
        );
        return;
      }
    }
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to update skill");
  }
};

export const deleteSkill = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const existingSkill = await prisma.skill.findUnique({
      where: { id },
    });

    if (!existingSkill) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Skill not found");
      return;
    }

    if (existingSkill.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Not authorized to delete this skill"
      );
      return;
    }

    await prisma.skill.delete({
      where: { id },
    });

    // Invalidate skills gap analysis cache when skills change
    // Delete the analyses so they will be regenerated with updated skills
    // This prevents creating history snapshots with stale data
    await prisma.skills_gap_analysis.deleteMany({
      where: { user_id: userId },
    });

    res.status(204).send();
  } catch (error) {
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to delete skill");
  }
};
