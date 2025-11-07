import { Request, Response } from "express";
import { sendErrorResponse } from "../utils/errorResponse";
import { aiService } from "../services/aiService";
import { prisma } from "../db";

export const generateTailoredResume = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId, jobDescription } = req.body;

    if (!userId) {
      sendErrorResponse(res, 400, "VALIDATION_ERROR", "User ID is required", [
        { field: "userId", message: "User ID is required" },
      ]);
      return;
    }

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

    // Fetch user's profile data
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
      },
    });

    if (!userProfile) {
      sendErrorResponse(res, 404, "NOT_FOUND", "User profile not found");
      return;
    }

    // Build input for AI service
    const resumeInput = {
      userProfile: {
        firstName: userProfile.firstName || "",
        lastName: userProfile.lastName || "",
        email: userProfile.email || "",
        phone: userProfile.phone_number || "",
        location: `${userProfile.locationCity || ""}, ${
          userProfile.locationState || ""
        }`.trim(),
        headline: userProfile.headline || undefined,
        bio: userProfile.bio || undefined,
      },
      workExperiences: userProfile.workExperiences.map((exp) => ({
        companyName: exp.companyName,
        positionTitle: exp.positionTitle,
        startDate: exp.startDate.toISOString(),
        endDate: exp.endDate?.toISOString(),
        description: exp.description || "",
      })),
      education: userProfile.education.map((edu) => ({
        institutionName: edu.institutionName,
        degreeType: edu.degreeType || "",
        major: edu.major || "",
        graduationDate: edu.graduationDate?.toISOString(),
      })),
      skills: userProfile.skills.map((skill) => ({
        skillName: skill.skillName,
        proficiencyLevel: skill.proficiencyLevel || undefined,
      })),
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
    const { userId, jobId } = req.body;

    if (!userId) {
      sendErrorResponse(res, 400, "VALIDATION_ERROR", "User ID is required", [
        { field: "userId", message: "User ID is required" },
      ]);
      return;
    }

    if (!jobId) {
      sendErrorResponse(res, 400, "VALIDATION_ERROR", "Job ID is required", [
        { field: "jobId", message: "Job ID is required" },
      ]);
      return;
    }

    // Fetch user profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      include: {
        workExperiences: true,
        skills: true,
      },
    });

    if (!userProfile) {
      sendErrorResponse(res, 404, "NOT_FOUND", "User profile not found");
      return;
    }

    // Fetch job opportunity
    const job = await prisma.jobOpportunity.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Job not found");
      return;
    }

    // Build input for AI service
    const coverLetterInput = {
      userProfile: {
        firstName: userProfile.firstName || "",
        lastName: userProfile.lastName || "",
        email: userProfile.email || "",
        phone: userProfile.phone_number || "",
      },
      targetJob: {
        title: job.title,
        company: job.company,
        description: job.description || "",
      },
      relevantExperience: userProfile.workExperiences
        .slice(0, 3)
        .map(
          (exp) =>
            `${exp.positionTitle} at ${exp.companyName}: ${exp.description}`
        ),
      relevantSkills: userProfile.skills.slice(0, 10).map((s) => s.skillName),
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
