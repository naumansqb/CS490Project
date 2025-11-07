import { Request, Response } from "express";
import { sendErrorResponse } from "../utils/errorResponse";
import { aiService } from "../services/aiService";

export const generateTailoredResume = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userProfile, workExperiences, education, skills, jobDescription } =
      req.body;

    if (!jobDescription) {
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Job description is required",
        [{ field: "jobDescription", message: "Job description is required" }]
      );
      return;
    }

    if (!userProfile) {
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "User profile is required",
        [{ field: "userProfile", message: "User profile is required" }]
      );
      return;
    }

    if (!workExperiences || !Array.isArray(workExperiences)) {
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Work experiences are required",
        [
          {
            field: "workExperiences",
            message: "Work experiences must be an array",
          },
        ]
      );
      return;
    }

    if (!education || !Array.isArray(education)) {
      sendErrorResponse(res, 400, "VALIDATION_ERROR", "Education is required", [
        { field: "education", message: "Education must be an array" },
      ]);
      return;
    }

    if (!skills || !Array.isArray(skills)) {
      sendErrorResponse(res, 400, "VALIDATION_ERROR", "Skills are required", [
        { field: "skills", message: "Skills must be an array" },
      ]);
      return;
    }

    const resumeInput = {
      userProfile,
      workExperiences,
      education,
      skills,
      jobDescription,
    };

    const tailoredResume = await aiService.generateTailoredResume(resumeInput);

    res.status(200).json({
      success: true,
      data: tailoredResume,
    });
  } catch (error) {
    console.error("[Generate Resume Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to generate tailored resume"
    );
  }
};

export const generateCoverLetter = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userProfile, targetJob, relevantExperience, relevantSkills } =
      req.body;

    if (!userProfile) {
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "User profile is required",
        [{ field: "userProfile", message: "User profile is required" }]
      );
      return;
    }

    if (!targetJob) {
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Target job is required",
        [{ field: "targetJob", message: "Target job is required" }]
      );
      return;
    }

    if (!relevantExperience || !Array.isArray(relevantExperience)) {
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Relevant experience is required",
        [
          {
            field: "relevantExperience",
            message: "Relevant experience must be an array",
          },
        ]
      );
      return;
    }

    if (!relevantSkills || !Array.isArray(relevantSkills)) {
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Relevant skills are required",
        [
          {
            field: "relevantSkills",
            message: "Relevant skills must be an array",
          },
        ]
      );
      return;
    }

    const coverLetterInput = {
      userProfile,
      targetJob,
      relevantExperience,
      relevantSkills,
    };

    const coverLetter = await aiService.generateCoverLetter(coverLetterInput);

    res.status(200).json({
      success: true,
      data: coverLetter,
    });
  } catch (error) {
    console.error("[Generate Cover Letter Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to generate cover letter"
    );
  }
};
