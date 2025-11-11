// controllers/coverLetter.controller.ts
import { Request, Response } from "express";
import { sendErrorResponse } from "../utils/errorResponse";
import { prisma } from "../db";

export const createCoverLetter = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId, jobId, title, content, tone, culture } = req.body;

    if (!userId) {
      sendErrorResponse(res, 400, "VALIDATION_ERROR", "User ID is required", [
        { field: "userId", message: "User ID is required" },
      ]);
      return;
    }

    if (!title) {
      sendErrorResponse(res, 400, "VALIDATION_ERROR", "Title is required", [
        { field: "title", message: "Title is required" },
      ]);
      return;
    }

    if (!content) {
      sendErrorResponse(res, 400, "VALIDATION_ERROR", "Content is required", [
        { field: "content", message: "Content is required" },
      ]);
      return;
    }

    const coverLetter = await prisma.coverLetter.create({
      data: {
        userId,
        jobId: jobId || null,
        title,
        content,
        tone: tone || null,
        culture: culture || null,
      },
    });

    res.status(201).json({
      success: true,
      data: coverLetter,
    });
  } catch (error) {
    console.error("[Create Cover Letter Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to create cover letter"
    );
  }
};

export const getCoverLetter = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const coverLetter = await prisma.coverLetter.findUnique({
      where: { id },
      include: {
        jobOpportunity: true,
      },
    });

    if (!coverLetter) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Cover letter not found");
      return;
    }

    res.status(200).json({
      success: true,
      data: coverLetter,
    });
  } catch (error) {
    console.error("[Get Cover Letter Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to retrieve cover letter"
    );
  }
};

export const getCoverLettersByUserId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    const coverLetters = await prisma.coverLetter.findMany({
      where: { userId },
      include: {
        jobOpportunity: {
          select: {
            id: true,
            title: true,
            company: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      data: coverLetters,
    });
  } catch (error) {
    console.error("[Get Cover Letters by User Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to retrieve cover letters"
    );
  }
};

export const getCoverLettersByJobId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { jobId } = req.params;

    const coverLetters = await prisma.coverLetter.findMany({
      where: { jobId },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      data: coverLetters,
    });
  } catch (error) {
    console.error("[Get Cover Letters by Job Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to retrieve cover letters"
    );
  }
};

export const updateCoverLetter = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content, tone, culture } = req.body;

    const coverLetter = await prisma.coverLetter.findUnique({
      where: { id },
    });

    if (!coverLetter) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Cover letter not found");
      return;
    }

    const updated = await prisma.coverLetter.update({
      where: { id },
      data: {
        title: title || coverLetter.title,
        content: content || coverLetter.content,
        tone: tone !== undefined ? tone : coverLetter.tone,
        culture: culture !== undefined ? culture : coverLetter.culture,
      },
    });

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("[Update Cover Letter Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to update cover letter"
    );
  }
};

export const deleteCoverLetter = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const coverLetter = await prisma.coverLetter.findUnique({
      where: { id },
    });

    if (!coverLetter) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Cover letter not found");
      return;
    }

    await prisma.coverLetter.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error("[Delete Cover Letter Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to delete cover letter"
    );
  }
};
