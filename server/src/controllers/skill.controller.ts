import { Request, Response } from "express";
import { prisma } from "../db";
import { Prisma } from "@prisma/client";
import {
  validateSkill,
  validateSkillUpdate,
} from "../validators/skill.validator";
import { sendErrorResponse } from "../utils/errorResponse";

export const createSkill = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validationErrors = validateSkill(req.body);
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
      data: req.body,
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

export const getSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const skill = await prisma.skill.findUnique({
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

    if (!skill) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Skill not found");
      return;
    }

    res.json(skill);
  } catch (error) {
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to fetch skill");
  }
};

export const getSkillsByUserId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
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
  req: Request,
  res: Response
): Promise<void> => {
  try {
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

    const { id } = req.params;
    const skill = await prisma.skill.update({
      where: { id },
      data: req.body,
    });
    res.json(skill);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        sendErrorResponse(res, 404, "NOT_FOUND", "Skill not found");
        return;
      }
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
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.skill.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        sendErrorResponse(res, 404, "NOT_FOUND", "Skill not found");
        return;
      }
    }
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to delete skill");
  }
};
