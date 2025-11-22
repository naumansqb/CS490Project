import { Request, Response } from "express";
import { sendErrorResponse } from "../utils/errorResponse";
import { aiService } from "../services/aiService";
import { prisma } from "../db";
import multer from "multer";
import mammoth from "mammoth";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  JobMatchWeights,
  JobMatchingInput,
  JobMatchPreferences as JobMatchPreferencesType,
  SkillsGapInput,
} from "../types/ai.types";
import { Prisma } from "@prisma/client";

// Configure multer for file uploads (DOCX/DOC/TXT only - no PDF)
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only DOCX, DOC, and TXT files are allowed."
        )
      );
    }
  },
});

type WeightOverrideInput = Partial<JobMatchWeights>;

const DEFAULT_MATCH_WEIGHTS: JobMatchWeights = {
  skills: 1,
  experience: 1,
  education: 1,
  requirements: 1,
};

const MIN_WEIGHT_VALUE = 0.1;
const MAX_WEIGHT_VALUE = 3;

const clampWeightValue = (value?: unknown): number | null => {
  if (value === undefined || value === null) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  if (numeric <= 0) return null;
  const clamped = Math.min(Math.max(numeric, MIN_WEIGHT_VALUE), MAX_WEIGHT_VALUE);
  return Math.round(clamped * 100) / 100;
};

const sanitizeCustomCriteria = (
  customCriteria?: Record<string, number>
): Record<string, number> | undefined => {
  if (!customCriteria) return undefined;
  const sanitizedEntries = Object.entries(customCriteria)
    .map(([key, value]) => [key.trim(), clampWeightValue(value)] as const)
    .filter(
      ([key, value]) =>
        Boolean(key) && value !== null
    )
    .map(([key, value]) => [key, value as number]);

  if (!sanitizedEntries.length) {
    return undefined;
  }

  return Object.fromEntries(sanitizedEntries);
};

const sanitizeWeightInput = (
  input?: WeightOverrideInput | null
): JobMatchWeights | null => {
  if (!input) return null;
  const sanitized: JobMatchWeights = {
    skills: clampWeightValue(input.skills) ?? DEFAULT_MATCH_WEIGHTS.skills,
    experience:
      clampWeightValue(input.experience) ?? DEFAULT_MATCH_WEIGHTS.experience,
    education:
      clampWeightValue(input.education) ?? DEFAULT_MATCH_WEIGHTS.education,
    requirements:
      clampWeightValue(input.requirements) ?? DEFAULT_MATCH_WEIGHTS.requirements,
  };

  const custom = sanitizeCustomCriteria(input.customCriteria);
  if (custom) {
    sanitized.customCriteria = custom;
  }

  const hasOverrides =
    clampWeightValue(input.skills) !== null ||
    clampWeightValue(input.experience) !== null ||
    clampWeightValue(input.education) !== null ||
    clampWeightValue(input.requirements) !== null ||
    (custom && Object.keys(custom).length > 0);

  return hasOverrides ? sanitized : null;
};

const mergeWeightSets = (
  base: JobMatchWeights,
  preference?: JobMatchWeights | null,
  overrides?: JobMatchWeights | null
): JobMatchWeights => {
  const merged: JobMatchWeights = {
    skills: base.skills,
    experience: base.experience,
    education: base.education,
    requirements: base.requirements,
    customCriteria: base.customCriteria
      ? { ...base.customCriteria }
      : undefined,
  };

  const apply = (source?: JobMatchWeights | null) => {
    if (!source) return;
    merged.skills = clampWeightValue(source.skills) ?? merged.skills;
    merged.experience = clampWeightValue(source.experience) ?? merged.experience;
    merged.education = clampWeightValue(source.education) ?? merged.education;
    merged.requirements =
      clampWeightValue(source.requirements) ?? merged.requirements;
    if (source.customCriteria) {
      merged.customCriteria = {
        ...(merged.customCriteria || {}),
        ...sanitizeCustomCriteria(source.customCriteria),
      };
    }
  };

  apply(preference);
  apply(overrides);

  if (
    merged.skills <= 0 &&
    merged.experience <= 0 &&
    merged.education <= 0 &&
    merged.requirements <= 0 &&
    (!merged.customCriteria ||
      !Object.values(merged.customCriteria).some((value) => value > 0))
  ) {
    return { ...DEFAULT_MATCH_WEIGHTS };
  }

  if (
    merged.customCriteria &&
    !Object.keys(merged.customCriteria).length
  ) {
    delete merged.customCriteria;
  }

  return merged;
};

const sortWeightsForComparison = (weights: JobMatchWeights) => ({
  skills: Math.round(weights.skills * 10000) / 10000,
  experience: Math.round(weights.experience * 10000) / 10000,
  education: Math.round(weights.education * 10000) / 10000,
  requirements: Math.round(weights.requirements * 10000) / 10000,
  customCriteria: weights.customCriteria
    ? Object.fromEntries(
        Object.entries(weights.customCriteria)
          .map(([key, value]) => [String(key), Math.round(value * 10000) / 10000])
          .sort(([a], [b]) => String(a).localeCompare(String(b)))
      )
    : undefined,
});

const weightsEqual = (
  a: JobMatchWeights | null | undefined,
  b: JobMatchWeights | null | undefined
): boolean => {
  if (!a || !b) return false;
  return (
    JSON.stringify(sortWeightsForComparison(a)) ===
    JSON.stringify(sortWeightsForComparison(b))
  );
};

const parseWeightsFromJson = (value: unknown): JobMatchWeights | null => {
  if (!value || typeof value !== "object") return null;
  const parsed = sanitizeWeightInput(value as WeightOverrideInput);
  return parsed || DEFAULT_MATCH_WEIGHTS;
};

const formatWeightsForResponse = (
  weights: JobMatchWeights
): JobMatchPreferencesType => {
  const round = (val: number) => Math.round(val * 100) / 100;
  const formatted: JobMatchPreferencesType = {
    skills: round(weights.skills),
    experience: round(weights.experience),
    education: round(weights.education),
    requirements: round(weights.requirements),
  };
  if (weights.customCriteria) {
    formatted.customCriteria = Object.fromEntries(
      Object.entries(weights.customCriteria)
        .map(([key, value]) => [String(key), round(value)])
        .sort(([a], [b]) => String(a).localeCompare(String(b)))
    );
  }
  return formatted;
};

const escapeCsvField = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const getUserMatchPreferences = async (
  userId: string
): Promise<JobMatchWeights | null> => {
  const prefs = await prisma.job_match_preferences.findUnique({
    where: { user_id: userId },
  });
  if (!prefs) return null;

  const sanitized = sanitizeWeightInput({
    skills: prefs.skills_weight ? Number(prefs.skills_weight) : undefined,
    experience: prefs.experience_weight
      ? Number(prefs.experience_weight)
      : undefined,
    education: prefs.education_weight ? Number(prefs.education_weight) : undefined,
    requirements: prefs.requirements_weight
      ? Number(prefs.requirements_weight)
      : undefined,
    customCriteria: (prefs.custom_criteria as Record<string, number>) || undefined,
  });

  return sanitized || { ...DEFAULT_MATCH_WEIGHTS };
};

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
    const {
      userId,
      jobId,
      tone,
      culture,
      length,
      writingStyle,
      customInstructions,
      personalityLevel,
      // Company research overrides (optional)
      companyBackground,
      recentNews,
      companyMission,
      companyInitiatives,
      companySize,
      fundingInfo,
      competitiveLandscape,
    } = req.body;

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
        industry: job.industry || undefined,
        // Use provided research if available, otherwise use job data
        companyBackground: companyBackground || undefined,
        recentNews: recentNews || undefined,
        companyMission: companyMission || undefined,
        companyInitiatives: companyInitiatives || undefined,
        companySize: companySize || undefined,
        fundingInfo: fundingInfo || undefined,
        competitiveLandscape: competitiveLandscape || undefined,
      },
      relevantExperience: userProfile.workExperiences
        .slice(0, 3)
        .map(
          (exp) =>
            `${exp.positionTitle} at ${exp.companyName}: ${exp.description}`
        ),
      relevantSkills: userProfile.skills.slice(0, 10).map((s) => s.skillName),
      tone: tone || "formal",
      culture: culture || "corporate",
      length: length || "standard",
      writingStyle: writingStyle || "direct",
      customInstructions: customInstructions || undefined,
      personalityLevel: personalityLevel || "moderate",
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

export const tailorResumeToJob = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { resumeId } = req.params;
    const { jobId, userId, selectedSkills, currentResumeContent } = req.body;

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

    // Fetch resume
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Resume not found");
      return;
    }

    // Verify resume belongs to user
    if (resume.userId !== userId) {
      sendErrorResponse(res, 403, "FORBIDDEN", "Access denied");
      return;
    }

    // Fetch resume template info
    const resumeWithTemplate = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: {
        template: true,
      },
    });

    // Fetch user's profile data with ALL relevant sections
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
          orderBy: { displayOrder: "asc" },
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

    // Fetch job opportunity
    const job = await prisma.jobOpportunity.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Job not found");
      return;
    }

    // Build job description
    const jobDescription = `
Job Title: ${job.title}
Company: ${job.company}
Location: ${job.location || "Not specified"}
${job.description || ""}
Industry: ${job.industry}
Job Type: ${job.jobType}
    `.trim();

    // Build input for AI service
    // PRIORITY: Use current resume content if provided (for imported resumes)
    // FALLBACK: Use profile data if no resume content exists
    const useResumeContent =
      currentResumeContent &&
      (currentResumeContent.workExperience?.length > 0 ||
        currentResumeContent.summary);

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
      // If resume has content, use that; otherwise use profile data
      currentResumeSummary: useResumeContent
        ? currentResumeContent.summary
        : undefined,
      workExperiences: useResumeContent
        ? (currentResumeContent.workExperience || []).map((exp: any) => ({
            companyName: exp.company,
            positionTitle: exp.title,
            startDate: exp.startDate,
            endDate: exp.endDate,
            description: (exp.bullets || []).join("\n"),
          }))
        : userProfile.workExperiences.map((exp) => ({
            companyName: exp.companyName,
            positionTitle: exp.positionTitle,
            startDate: exp.startDate.toISOString(),
            endDate: exp.endDate?.toISOString(),
            description: exp.description || "",
          })),
      education:
        useResumeContent && currentResumeContent.education?.length > 0
          ? currentResumeContent.education.map((edu: any) => ({
              institutionName: edu.school || edu.institutionName,
              degreeType: edu.degree || edu.degreeType || "",
              major: edu.major || "",
              graduationDate: edu.graduationDate,
            }))
          : userProfile.education.map((edu) => ({
              institutionName: edu.institutionName,
              degreeType: edu.degreeType || "",
              major: edu.major || "",
              graduationDate: edu.graduationDate?.toISOString(),
            })),
      // Skills: Use resume skills if available, otherwise profile
      skills:
        useResumeContent && currentResumeContent.skillsList?.length > 0
          ? currentResumeContent.skillsList.map((skillName: string) => ({
              skillName,
              proficiencyLevel: undefined,
            }))
          : selectedSkills && selectedSkills.length > 0
          ? userProfile.skills
              .filter((skill) => selectedSkills.includes(skill.skillName))
              .map((skill) => ({
                skillName: skill.skillName,
                proficiencyLevel: skill.proficiencyLevel || undefined,
              }))
          : userProfile.skills.map((skill) => ({
              skillName: skill.skillName,
              proficiencyLevel: skill.proficiencyLevel || undefined,
            })),
      certifications:
        useResumeContent && currentResumeContent.certifications?.length > 0
          ? currentResumeContent.certifications
          : userProfile.certifications.map((cert) => ({
              name: cert.name,
              issuingOrganization: cert.issuingOrganization,
              issueDate: cert.issueDate.toISOString(),
              expirationDate: cert.expirationDate?.toISOString(),
            })),
      projects:
        useResumeContent && currentResumeContent.projects?.length > 0
          ? currentResumeContent.projects
          : userProfile.specialProjects.map((proj) => ({
              projectName: proj.projectName,
              description: proj.description,
              technologies: proj.skillsDemonstrated || [],
              startDate: proj.startDate?.toISOString(),
              endDate: proj.endDate?.toISOString(),
            })),
      templateType: resumeWithTemplate?.template?.type || "chronological",
      templateName: resumeWithTemplate?.template?.name || "",
      userSelectedSkills: selectedSkills || [], // Pass to AI so it knows these are user-selected
      jobDescription,
    };

    const tailoredResume = await aiService.generateTailoredResume(resumeInput);

    res.status(200).json({
      success: true,
      data: {
        ...tailoredResume,
        jobInfo: {
          id: job.id,
          title: job.title,
          company: job.company,
        },
        templateInfo: {
          type: resumeWithTemplate?.template?.type || "chronological",
          name: resumeWithTemplate?.template?.name || "",
        },
      },
    });
  } catch (error) {
    console.error("[Tailor Resume to Job Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to tailor resume to job"
    );
  }
};

export const parseResumeFromFile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      sendErrorResponse(res, 400, "VALIDATION_ERROR", "No file uploaded", [
        { field: "file", message: "File is required" },
      ]);
      return;
    }

    const file = req.file;
    let extractedText = "";

    // Extract text based on file type (DOCX/DOC/TXT only)
    if (
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.mimetype === "application/msword"
    ) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      extractedText = result.value;
    } else if (file.mimetype === "text/plain") {
      extractedText = file.buffer.toString("utf8");
    } else {
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Unsupported file type. Only DOCX, DOC, and TXT are supported."
      );
      return;
    }

    if (!extractedText || extractedText.trim().length < 50) {
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Could not extract sufficient text from the resume. Please check your file."
      );
      return;
    }

    // Parse resume using AI
    const parsedData = await aiService.parseResume(extractedText);

    res.status(200).json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error("[Parse Resume Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      error.message || "Failed to parse resume"
    );
  }
};

export const researchCompany = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { companyName, industry } = req.body;

    if (!companyName) {
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Company name is required",
        [{ field: "companyName", message: "Company name is required" }]
      );
      return;
    }

    console.log(`[Company Research] Researching: ${companyName}`);

    // Use AI to research the company
    const companyResearch = await aiService.researchCompany({
      companyName,
    });

    res.status(200).json({
      success: true,
      data: companyResearch,
    });
  } catch (error: any) {
    console.error("[Research Company Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      error.message || "Failed to research company"
    );
  }
};

export const getEditingSuggestions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { content, type } = req.body;

    if (!content) {
      sendErrorResponse(res, 400, "VALIDATION_ERROR", "Content is required", [
        { field: "content", message: "Content is required" },
      ]);
      return;
    }

    if (!type) {
      sendErrorResponse(res, 400, "VALIDATION_ERROR", "Type is required", [
        { field: "type", message: "Type is required" },
      ]);
      return;
    }

    console.log(`[Editing Suggestions] Analyzing ${type} content`);

    // Get AI editing suggestions
    const suggestions = await aiService.getEditingSuggestions({
      content,
      type,
    });

    res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error: any) {
    console.error("[Get Editing Suggestions Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      error.message || "Failed to get editing suggestions"
    );
  }
};

export const analyzeExperienceRelevance = async (
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

    console.log(
      `[Experience Analysis] Analyzing experiences for user ${userId} and job ${jobId}`
    );

    // Fetch user profile with experiences
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      include: {
        workExperiences: {
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    if (!userProfile) {
      sendErrorResponse(res, 404, "NOT_FOUND", "User profile not found");
      return;
    }

    if (
      !userProfile.workExperiences ||
      userProfile.workExperiences.length === 0
    ) {
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "No work experiences found for user"
      );
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

    // Format experiences for AI analysis
    const experiences = userProfile.workExperiences.map((exp) => ({
      positionTitle: exp.positionTitle,
      companyName: exp.companyName,
      startDate: exp.startDate.toISOString().split("T")[0],
      endDate: exp.endDate ? exp.endDate.toISOString().split("T")[0] : null,
      description: exp.description || "",
    }));

    // Analyze experience relevance using AI
    const analysis = await aiService.analyzeExperienceRelevance({
      experiences,
      jobDescription: job.description || "",
      jobTitle: job.title,
    });

    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error: any) {
    console.error("[Analyze Experience Relevance Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      error.message || "Failed to analyze experience relevance"
    );
  }
};

/**
 * Analyze job match between user profile and a job opportunity
 * Implements caching: checks DB for existing analysis, uses cache if fresh (< 24 hours),
 * otherwise calls AI service and saves result to DB
 */
export const analyzeJobMatch = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { jobId, forceRefresh, weights: weightOverrides } = req.body;

    if (!userId) {
      sendErrorResponse(res, 401, "UNAUTHORIZED", "Authentication required");
      return;
    }

    if (!jobId) {
      sendErrorResponse(res, 400, "VALIDATION_ERROR", "Job ID is required", [
        { field: "jobId", message: "Job ID is required" },
      ]);
      return;
    }

    const preferenceWeights = await getUserMatchPreferences(userId);
    const overrideWeights = sanitizeWeightInput(weightOverrides);
    const finalWeights = mergeWeightSets(
      { ...DEFAULT_MATCH_WEIGHTS },
      preferenceWeights,
      overrideWeights
    );

    const now = new Date();
    const cacheExpiryDate = new Date(now);
    cacheExpiryDate.setHours(cacheExpiryDate.getHours() - 24);

    const cachedAnalysis = await prisma.job_match_analysis.findFirst({
      where: {
        job_id: jobId,
        user_id: userId,
      },
      orderBy: {
        analysis_date: "desc",
      },
    });

    if (!forceRefresh && cachedAnalysis && cachedAnalysis.analysis_date) {
      const analysisDate = new Date(cachedAnalysis.analysis_date);
      const cachedWeights = parseWeightsFromJson(
        cachedAnalysis.weights_used as unknown
      );
      if (
        analysisDate >= cacheExpiryDate &&
        cachedWeights &&
        weightsEqual(cachedWeights, finalWeights)
      ) {
        const cachedData = {
          overallMatchScore: cachedAnalysis.overall_match_score,
          categoryScores: cachedAnalysis.category_scores as any,
          strengths: cachedAnalysis.strengths as any,
          gaps: cachedAnalysis.gaps as any,
          improvementSuggestions: cachedAnalysis.improvement_suggestions as any,
          matchedSkills: cachedAnalysis.matched_skills as any,
          missingSkills: cachedAnalysis.missing_skills as any,
        };

        res.status(200).json({
          success: true,
          data: cachedData,
          cached: true,
          analysisDate: cachedAnalysis.analysis_date,
          weightsUsed: formatWeightsForResponse(cachedWeights),
        });
        return;
      }
    }

    // Cache miss or stale - fetch fresh data and analyze
    // Fetch user profile with all relevant data
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

    // Fetch job opportunity
    const job = await prisma.jobOpportunity.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Job opportunity not found");
      return;
    }

    // Verify job belongs to user
    if (job.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Not authorized to access this job"
      );
      return;
    }

    // Build input for AI service
    const jobMatchingInput: JobMatchingInput = {
      jobDescription: job.description || "",
      userSkills: userProfile.skills.map((skill) => ({
        skillName: skill.skillName,
        proficiencyLevel: skill.proficiencyLevel || undefined,
        yearsOfExperience: skill.yearsOfExperience
          ? Number(skill.yearsOfExperience)
          : undefined,
      })),
      userExperience: userProfile.workExperiences.map((exp) => ({
        companyName: exp.companyName,
        positionTitle: exp.positionTitle,
        startDate: exp.startDate.toISOString(),
        endDate: exp.endDate?.toISOString(),
        description: exp.description || "",
      })),
      userEducation: userProfile.education.map((edu) => ({
        degreeType: edu.degreeType || "",
        major: edu.major || "",
        institutionName: edu.institutionName || undefined,
        graduationDate: edu.graduationDate?.toISOString(),
      })),
      companyName: job.company,
      jobTitle: job.title,
      weights: finalWeights,
    };

    // Call AI service
    const analysisResult = await aiService.analyzeJobMatch(jobMatchingInput);

    const createdAnalysis = await prisma.job_match_analysis.create({
      data: {
        job_id: jobId,
        user_id: userId,
        overall_match_score: analysisResult.overallMatchScore,
        category_scores: analysisResult.categoryScores as any,
        strengths: analysisResult.strengths as any,
        gaps: analysisResult.gaps as any,
        improvement_suggestions: analysisResult.improvementSuggestions as any,
        matched_skills: analysisResult.matchedSkills as any,
        missing_skills: analysisResult.missingSkills as any,
        weights_used: finalWeights as unknown as Prisma.InputJsonValue,
        analysis_date: now,
        created_at: now,
        updated_at: now,
      },
    });

    // Return result
    res.status(200).json({
      success: true,
      data: analysisResult,
      cached: false,
      analysisDate: createdAnalysis.analysis_date,
      weightsUsed: formatWeightsForResponse(finalWeights),
    });
  } catch (error) {
    console.error("[Analyze Job Match Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to analyze job match"
    );
  }
};

/**
 * Get saved job match weighting preferences
 */
export const getJobMatchPreferences = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      sendErrorResponse(res, 401, "UNAUTHORIZED", "Authentication required");
      return;
    }

    const prefsRecord = await prisma.job_match_preferences.findUnique({
      where: { user_id: userId },
    });

    const sanitized =
      prefsRecord &&
      sanitizeWeightInput({
        skills: prefsRecord.skills_weight
          ? Number(prefsRecord.skills_weight)
          : undefined,
        experience: prefsRecord.experience_weight
          ? Number(prefsRecord.experience_weight)
          : undefined,
        education: prefsRecord.education_weight
          ? Number(prefsRecord.education_weight)
          : undefined,
        requirements: prefsRecord.requirements_weight
          ? Number(prefsRecord.requirements_weight)
          : undefined,
        customCriteria:
          (prefsRecord.custom_criteria as Record<string, number>) || undefined,
      });

    const responseWeights =
      sanitized ?? { ...DEFAULT_MATCH_WEIGHTS, customCriteria: undefined };

    res.status(200).json({
      success: true,
      data: {
        weights: formatWeightsForResponse(responseWeights),
        isCustom: Boolean(prefsRecord),
        defaultWeights: formatWeightsForResponse(DEFAULT_MATCH_WEIGHTS),
      },
    });
  } catch (error) {
    console.error("[Get Job Match Preferences Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch job match preferences"
    );
  }
};

/**
 * Update job match weighting preferences
 */
export const updateJobMatchPreferences = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      sendErrorResponse(res, 401, "UNAUTHORIZED", "Authentication required");
      return;
    }

    const sanitized = sanitizeWeightInput(req.body);
    if (!sanitized) {
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Provide at least one valid weight value",
        [
          {
            field: "weights",
            message:
              "Weights must be numbers greater than 0. Adjust at least one slider.",
          },
        ]
      );
      return;
    }

    await prisma.job_match_preferences.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        skills_weight: new Prisma.Decimal(sanitized.skills),
        experience_weight: new Prisma.Decimal(sanitized.experience),
        education_weight: new Prisma.Decimal(sanitized.education),
        requirements_weight: new Prisma.Decimal(sanitized.requirements),
        custom_criteria:
          sanitized.customCriteria ? (sanitized.customCriteria as Prisma.InputJsonValue) : Prisma.DbNull,
        created_at: new Date(),
        updated_at: new Date(),
      },
      update: {
        skills_weight: new Prisma.Decimal(sanitized.skills),
        experience_weight: new Prisma.Decimal(sanitized.experience),
        education_weight: new Prisma.Decimal(sanitized.education),
        requirements_weight: new Prisma.Decimal(sanitized.requirements),
        custom_criteria:
          sanitized.customCriteria ? (sanitized.customCriteria as Prisma.InputJsonValue) : Prisma.DbNull,
        updated_at: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      data: {
        weights: formatWeightsForResponse(sanitized),
      },
    });
  } catch (error) {
    console.error("[Update Job Match Preferences Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to update job match preferences"
    );
  }
};

/**
 * Get job match analysis history for a job
 */
export const getJobMatchHistory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { jobId } = req.params;
    const limitParam = req.query.limit as string | undefined;
    const limit = Math.min(Math.max(parseInt(limitParam || "20", 10) || 20, 1), 100);

    if (!userId) {
      sendErrorResponse(res, 401, "UNAUTHORIZED", "Authentication required");
      return;
    }

    if (!jobId) {
      sendErrorResponse(res, 400, "VALIDATION_ERROR", "Job ID is required", [
        { field: "jobId", message: "Job ID is required" },
      ]);
      return;
    }

    const job = await prisma.jobOpportunity.findUnique({
      where: { id: jobId },
      select: { id: true, userId: true, title: true, company: true },
    });

    if (!job || job.userId !== userId) {
      sendErrorResponse(
        res,
        404,
        "NOT_FOUND",
        "Job opportunity not found or access denied"
      );
      return;
    }

    const history = await prisma.job_match_analysis.findMany({
      where: { job_id: jobId, user_id: userId },
      orderBy: { analysis_date: "desc" },
      take: limit,
    });

    const entries = history.map((entry) => {
      const weights = parseWeightsFromJson(entry.weights_used as unknown);
      return {
        id: entry.id,
        analysisDate: entry.analysis_date,
        overallMatchScore: entry.overall_match_score,
        categoryScores: entry.category_scores as Record<string, number>,
        strengths: entry.strengths as any,
        gaps: entry.gaps as any,
        weightsUsed: weights ? formatWeightsForResponse(weights) : undefined,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        job: {
          id: job.id,
          title: job.title,
          company: job.company,
        },
        entries,
      },
    });
  } catch (error) {
    console.error("[Get Job Match History Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch job match history"
    );
  }
};

/**
 * Compare latest job match scores across jobs
 */
export const getJobMatchComparison = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      sendErrorResponse(res, 401, "UNAUTHORIZED", "Authentication required");
      return;
    }

    const statusFilter = (req.query.status as string) || "all";
    const limitParam = req.query.limit as string | undefined;
    const limit = Math.min(Math.max(parseInt(limitParam || "10", 10) || 10, 1), 100);
    const minScoreParam = req.query.minScore as string | undefined;
    const minScore = Math.max(parseInt(minScoreParam || "0", 10) || 0, 0);

    const jobWhere: Prisma.JobOpportunityWhereInput = {
      userId,
    };

    if (
      statusFilter !== "all" &&
      ["interested", "applied", "phone_screen", "interview", "offer", "rejected"].includes(
        statusFilter
      )
    ) {
      jobWhere.currentStatus = statusFilter as any;
    }

    const jobs = await prisma.jobOpportunity.findMany({
      where: jobWhere,
      orderBy: { updatedAt: "desc" },
      take: limit * 3,
      select: {
        id: true,
        title: true,
        company: true,
        currentStatus: true,
      },
    });

    const comparisons = (
      await Promise.all(
        jobs.map(async (job) => {
          const latestAnalysis = await prisma.job_match_analysis.findFirst({
            where: { job_id: job.id, user_id: userId },
            orderBy: { analysis_date: "desc" },
          });

          if (!latestAnalysis) return null;
          if (latestAnalysis.overall_match_score < minScore) return null;

          const weights = parseWeightsFromJson(
            latestAnalysis.weights_used as unknown
          );

          return {
            jobId: job.id,
            title: job.title,
            company: job.company,
            status: job.currentStatus,
            latestScore: latestAnalysis.overall_match_score,
            analysisDate: latestAnalysis.analysis_date,
            weightsUsed: weights ? formatWeightsForResponse(weights) : undefined,
          };
        })
      )
    )
      .filter(Boolean)
      .sort(
        (a, b) =>
          (b as any).latestScore - (a as any).latestScore
      )
      .slice(0, limit) as Array<{
      jobId: string;
      title: string;
      company: string;
      status: string | null;
      latestScore: number;
      analysisDate: Date | null;
      weightsUsed?: JobMatchPreferencesType;
    }>;

    res.status(200).json({
      success: true,
      data: comparisons,
    });
  } catch (error) {
    console.error("[Get Job Match Comparison Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch job match comparison data"
    );
  }
};

/**
 * Export job match analysis data to CSV
 */
export const exportJobMatchAnalysis = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      sendErrorResponse(res, 401, "UNAUTHORIZED", "Authentication required");
      return;
    }

    const jobIdsParam = (req.query.jobIds as string) || "";
    const jobIds = jobIdsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (!jobIds.length) {
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Provide at least one jobId to export",
        [{ field: "jobIds", message: "Comma separated job IDs are required" }]
      );
      return;
    }

    const jobs = await prisma.jobOpportunity.findMany({
      where: {
        id: { in: jobIds },
        userId,
      },
      select: {
        id: true,
        title: true,
        company: true,
      },
    });

    if (!jobs.length) {
      sendErrorResponse(
        res,
        404,
        "NOT_FOUND",
        "No matching jobs found for export"
      );
      return;
    }

    const jobMap = new Map<string, { title: string; company: string }>();
    jobs.forEach((job) =>
      jobMap.set(job.id, { title: job.title, company: job.company })
    );

    const analyses = await prisma.job_match_analysis.findMany({
      where: {
        job_id: { in: jobs.map((job) => job.id) },
        user_id: userId,
      },
      orderBy: [
        { job_id: "asc" },
        { analysis_date: "desc" },
      ],
    });

    const headers = [
      "Job ID",
      "Job Title",
      "Company",
      "Analysis Date",
      "Overall Score",
      "Skills Score",
      "Experience Score",
      "Education Score",
      "Requirements Score",
      "Top Strength",
      "Top Gap",
      "Weights Used",
    ];

    const rows = analyses.map((analysis) => {
      const jobInfo = jobMap.get(analysis.job_id);
      const strengths = (analysis.strengths as any[]) || [];
      const gaps = (analysis.gaps as any[]) || [];
      const weights = parseWeightsFromJson(analysis.weights_used as unknown);

      return [
        escapeCsvField(analysis.job_id),
        escapeCsvField(jobInfo?.title ?? ""),
        escapeCsvField(jobInfo?.company ?? ""),
        escapeCsvField(
          analysis.analysis_date
            ? new Date(analysis.analysis_date).toISOString()
            : ""
        ),
        escapeCsvField(analysis.overall_match_score),
        escapeCsvField(
          (analysis.category_scores as Record<string, number>)?.skills ?? ""
        ),
        escapeCsvField(
          (analysis.category_scores as Record<string, number>)?.experience ?? ""
        ),
        escapeCsvField(
          (analysis.category_scores as Record<string, number>)?.education ?? ""
        ),
        escapeCsvField(
          (analysis.category_scores as Record<string, number>)?.requirements ?? ""
        ),
        escapeCsvField(strengths[0]?.description ?? ""),
        escapeCsvField(gaps[0]?.description ?? ""),
        escapeCsvField(
          weights
            ? JSON.stringify(formatWeightsForResponse(weights))
            : ""
        ),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="job-match-analysis-${Date.now()}.csv"`
    );
    res.status(200).send(csvContent);
  } catch (error) {
    console.error("[Export Job Match Analysis Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to export job match analysis"
    );
  }
};

/**
 * Analyze skills gap between user skills and job requirements
 * Implements caching: checks DB for existing analysis, uses cache if fresh (< 24 hours),
 * otherwise calls AI service and saves result to DB
 */
export const analyzeSkillsGap = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { jobId, forceRefresh } = req.body;

    if (!userId) {
      sendErrorResponse(res, 401, "UNAUTHORIZED", "Authentication required");
      return;
    }

    if (!jobId) {
      sendErrorResponse(res, 400, "VALIDATION_ERROR", "Job ID is required", [
        { field: "jobId", message: "Job ID is required" },
      ]);
      return;
    }

    // Check for cached analysis (within last 24 hours)
    const cacheExpiryHours = 24;
    const cacheExpiryDate = new Date();
    cacheExpiryDate.setHours(cacheExpiryDate.getHours() - cacheExpiryHours);

    const cachedAnalysis = await prisma.skills_gap_analysis.findUnique({
      where: {
        job_id_user_id: {
          job_id: jobId,
          user_id: userId,
        },
      },
    } as any);

    // Return cached result if it exists and is fresh (skip if forceRefresh is true)
    if (!forceRefresh && cachedAnalysis && cachedAnalysis.analysis_date) {
      const analysisDate = new Date(cachedAnalysis.analysis_date);
      if (analysisDate >= cacheExpiryDate) {
        // Cache is fresh, return cached result
        const cachedData = {
          matchedSkills: cachedAnalysis.matched_skills as any,
          missingSkills: cachedAnalysis.missing_skills as any,
          weakSkills: cachedAnalysis.weak_skills as any,
          learningResources: cachedAnalysis.learning_resources as any,
          prioritizedLearningPath: cachedAnalysis.prioritized_learning_path as any,
          overallGapScore: cachedAnalysis.overall_gap_score,
        };

        res.status(200).json({
          success: true,
          data: cachedData,
          cached: true,
        });
        return;
      }
    }

    // Cache miss or stale - fetch fresh data and analyze
    // Fetch user profile with skills
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      include: {
        skills: {
          orderBy: { displayOrder: "asc" },
        },
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
      sendErrorResponse(res, 404, "NOT_FOUND", "Job opportunity not found");
      return;
    }

    // Verify job belongs to user
    if (job.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Not authorized to access this job"
      );
      return;
    }

    // Build input for AI service
    const skillsGapInput: SkillsGapInput = {
      jobDescription: job.description || "",
      userSkills: userProfile.skills.map((skill) => ({
        skillName: skill.skillName,
        proficiencyLevel: skill.proficiencyLevel || undefined,
        yearsOfExperience: skill.yearsOfExperience
          ? Number(skill.yearsOfExperience)
          : undefined,
      })),
      jobTitle: job.title,
      companyName: job.company,
    };

    // Call AI service
    const analysisResult = await aiService.analyzeSkillsGap(skillsGapInput);

    // Save to database (upsert - update if exists, create if not)
    // The trigger will automatically create history snapshot
    const analysisDate = new Date();
    await prisma.skills_gap_analysis.upsert({
      where: {
        job_id_user_id: {
          job_id: jobId,
          user_id: userId,
        },
      } as any,
      create: {
        job_id: jobId,
        user_id: userId,
        matched_skills: analysisResult.matchedSkills as any,
        missing_skills: analysisResult.missingSkills as any,
        weak_skills: analysisResult.weakSkills as any,
        learning_resources: analysisResult.learningResources as any,
        prioritized_learning_path: analysisResult.prioritizedLearningPath as any,
        overall_gap_score: analysisResult.overallGapScore,
        analysis_date: analysisDate,
      },
      update: {
        matched_skills: analysisResult.matchedSkills as any,
        missing_skills: analysisResult.missingSkills as any,
        weak_skills: analysisResult.weakSkills as any,
        learning_resources: analysisResult.learningResources as any,
        prioritized_learning_path: analysisResult.prioritizedLearningPath as any,
        overall_gap_score: analysisResult.overallGapScore,
        analysis_date: analysisDate,
        updated_at: new Date(),
      },
    });

    // Return result
    res.status(200).json({
      success: true,
      data: analysisResult,
      cached: false,
    });
  } catch (error) {
    console.error("[Analyze Skills Gap Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to analyze skills gap"
    );
  }
};

/**
 * Get interview insights and preparation recommendations for a job
 * Implements caching: checks DB for existing insights, uses cache if fresh (< 7 days),
 * otherwise calls AI service and saves result to DB
 * POST /api/ai/interview-insights/analyze
 */
export const getInterviewInsights = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { jobId, forceRefresh } = req.body;

    if (!userId) {
      sendErrorResponse(res, 401, "UNAUTHORIZED", "Authentication required");
      return;
    }

    if (!jobId) {
      sendErrorResponse(res, 400, "VALIDATION_ERROR", "Job ID is required", [
        { field: "jobId", message: "Job ID is required" },
      ]);
      return;
    }

    // Check for cached insights (within last 7 days - interview insights change less frequently)
    const cacheExpiryDays = 7;
    const cacheExpiryDate = new Date();
    cacheExpiryDate.setDate(cacheExpiryDate.getDate() - cacheExpiryDays);

    const cachedInsights = await prisma.interview_insights.findUnique({
      where: {
        job_id: jobId,
      },
    });

    // Return cached result if it exists and is fresh (skip if forceRefresh is true)
    if (!forceRefresh && cachedInsights && cachedInsights.research_date) {
      const researchDate = new Date(cachedInsights.research_date);
      if (researchDate >= cacheExpiryDate) {
        // Cache is fresh, return cached result
        const cachedData = {
          companyName: cachedInsights.company_name,
          jobTitle: cachedInsights.job_title,
          interviewProcess: cachedInsights.interview_process as any,
          commonQuestions: cachedInsights.common_questions as any,
          interviewerInformation: cachedInsights.interviewer_information as any,
          companySpecificInsights: cachedInsights.company_specific_insights as any,
          preparationRecommendations: cachedInsights.preparation_recommendations as any,
          researchDate: cachedInsights.research_date.toISOString().split('T')[0],
          confidence: cachedInsights.confidence as "high" | "medium" | "low",
        };

        res.status(200).json({
          success: true,
          data: cachedData,
          cached: true,
        });
        return;
      }
    }

    // Cache miss or stale - fetch fresh data
    // Fetch job opportunity
    const job = await prisma.jobOpportunity.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Job opportunity not found");
      return;
    }

    // Verify job belongs to user
    if (job.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Not authorized to access this job"
      );
      return;
    }

    // Get company information if available
    let companyWebsite: string | undefined;
    let industry: string | undefined;

    if (job.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: job.companyId },
        select: { website: true, industry: true },
      });
      if (company) {
        companyWebsite = company.website || undefined;
        industry = company.industry || undefined;
      }
    }

    // Build input for AI service
    const insightsInput = {
      companyName: job.company,
      jobTitle: job.title,
      jobDescription: job.description || undefined,
      industry: industry,
      companyWebsite: companyWebsite,
    };

    // Call AI service
    const insightsResult = await aiService.getInterviewInsights(insightsInput);

    // Save to database (upsert - update if exists, create if not)
    await prisma.interview_insights.upsert({
      where: {
        job_id: jobId,
      },
      create: {
        job_id: jobId,
        company_name: insightsResult.companyName,
        job_title: insightsResult.jobTitle,
        interview_process: insightsResult.interviewProcess as any,
        common_questions: insightsResult.commonQuestions as any,
        interviewer_information: insightsResult.interviewerInformation as any,
        company_specific_insights: insightsResult.companySpecificInsights as any,
        preparation_recommendations: insightsResult.preparationRecommendations as any,
        research_date: new Date(insightsResult.researchDate),
        confidence: insightsResult.confidence,
        analysis_date: new Date(),
      },
      update: {
        company_name: insightsResult.companyName,
        job_title: insightsResult.jobTitle,
        interview_process: insightsResult.interviewProcess as any,
        common_questions: insightsResult.commonQuestions as any,
        interviewer_information: insightsResult.interviewerInformation as any,
        company_specific_insights: insightsResult.companySpecificInsights as any,
        preparation_recommendations: insightsResult.preparationRecommendations as any,
        research_date: new Date(insightsResult.researchDate),
        confidence: insightsResult.confidence,
        analysis_date: new Date(),
        updated_at: new Date(),
      },
    });

    // Return result
    res.status(200).json({
      success: true,
      data: insightsResult,
      cached: false,
    });
  } catch (error) {
    console.error("[Get Interview Insights Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to get interview insights"
    );
  }
};

/**
 * Get skills gap progress tracking for a specific job
 * Returns historical snapshots showing how gap scores and skills have changed over time
 * GET /api/ai/skills-gap/progress/:jobId
 */
export const getSkillsGapProgress = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { jobId } = req.params;

    if (!userId) {
      sendErrorResponse(res, 401, "UNAUTHORIZED", "Authentication required");
      return;
    }

    if (!jobId) {
      sendErrorResponse(res, 400, "VALIDATION_ERROR", "Job ID is required", [
        { field: "jobId", message: "Job ID is required" },
      ]);
      return;
    }

    // Verify job belongs to user
    const job = await prisma.jobOpportunity.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Job opportunity not found");
      return;
    }

    if (job.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Not authorized to access this job"
      );
      return;
    }

    // Query history table using Prisma
    const history = await prisma.skills_gap_analysis_history.findMany({
      where: {
        job_id: jobId,
        user_id: userId,
      },
      orderBy: {
        snapshot_date: "desc",
      },
    });

    // Also get current analysis
    const currentAnalysis = await prisma.skills_gap_analysis.findUnique({
      where: {
        job_id_user_id: {
          job_id: jobId,
          user_id: userId,
        },
      } as any,
    });

    // Format response
    const progressData = {
      jobId,
      jobTitle: job.title,
      companyName: job.company,
      currentAnalysis: currentAnalysis
        ? {
            overallGapScore: currentAnalysis.overall_gap_score,
            analysisDate: currentAnalysis.analysis_date,
            matchedSkillsCount: Array.isArray(currentAnalysis.matched_skills)
              ? (currentAnalysis.matched_skills as any[]).length
              : 0,
            missingSkillsCount: Array.isArray(currentAnalysis.missing_skills)
              ? (currentAnalysis.missing_skills as any[]).length
              : 0,
            weakSkillsCount: Array.isArray(currentAnalysis.weak_skills)
              ? (currentAnalysis.weak_skills as any[]).length
              : 0,
          }
        : null,
      history: history.map((h) => ({
        id: h.id,
        overallGapScore: h.overall_gap_score,
        snapshotDate: h.snapshot_date,
        matchedSkillsCount: Array.isArray(h.matched_skills)
          ? (h.matched_skills as any[]).length
          : 0,
        missingSkillsCount: Array.isArray(h.missing_skills)
          ? (h.missing_skills as any[]).length
          : 0,
        weakSkillsCount: Array.isArray(h.weak_skills) ? (h.weak_skills as any[]).length : 0,
      })),
      progressMetrics: history.length > 0
        ? {
            firstScore: history[history.length - 1]?.overall_gap_score || 0,
            latestScore: history[0]?.overall_gap_score || 0,
            scoreImprovement:
              (history[0]?.overall_gap_score || 0) -
              (history[history.length - 1]?.overall_gap_score || 0),
            totalSnapshots: history.length,
            timeSpanDays:
              history.length > 1
                ? Math.floor(
                    (history[0].snapshot_date.getTime() -
                      history[history.length - 1].snapshot_date.getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : 0,
          }
        : null,
    };

    res.status(200).json({
      success: true,
      data: progressData,
    });
  } catch (error) {
    console.error("[Get Skills Gap Progress Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to get skills gap progress"
    );
  }
};

/**
 * Get skills gap trends across all jobs for a user
 * Returns comparison of gap analyses across multiple job opportunities
 * GET /api/ai/skills-gap/trends
 */
export const getSkillsGapTrends = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      sendErrorResponse(res, 401, "UNAUTHORIZED", "Authentication required");
      return;
    }

    // Get all skills gap analyses for the user
    const analyses = await prisma.skills_gap_analysis.findMany({
      where: { user_id: userId },
      include: {
        job_opportunity: {
          select: {
            id: true,
            title: true,
            company: true,
            industry: true,
          },
        },
      },
    });

    if (analyses.length === 0) {
      res.status(200).json({
        success: true,
        data: {
          totalJobs: 0,
          averageGapScore: 0,
          jobs: [],
          commonMissingSkills: [],
          commonWeakSkills: [],
          skillFrequency: {},
        },
      });
      return;
    }

    // Calculate average gap score
    const averageGapScore = Math.round(
      analyses.reduce((sum, a) => sum + a.overall_gap_score, 0) /
        analyses.length
    );

    // Extract all missing skills and count frequency
    const missingSkillsMap = new Map<string, { count: number; importance: string[] }>();
    const weakSkillsMap = new Map<string, { count: number; priority: string[] }>();

    analyses.forEach((analysis) => {
      const missingSkills = analysis.missing_skills as any[];
      const weakSkills = analysis.weak_skills as any[];

      if (Array.isArray(missingSkills)) {
        missingSkills.forEach((skill: any) => {
          const skillName = skill.skillName || skill.skill_name || "";
          if (skillName) {
            const existing = missingSkillsMap.get(skillName) || {
              count: 0,
              importance: [],
            };
            existing.count++;
            if (skill.importance && !existing.importance.includes(skill.importance)) {
              existing.importance.push(skill.importance);
            }
            missingSkillsMap.set(skillName, existing);
          }
        });
      }

      if (Array.isArray(weakSkills)) {
        weakSkills.forEach((skill: any) => {
          const skillName = skill.skillName || skill.skill_name || "";
          if (skillName) {
            const existing = weakSkillsMap.get(skillName) || {
              count: 0,
              priority: [],
            };
            existing.count++;
            if (
              skill.improvementPriority &&
              !existing.priority.includes(skill.improvementPriority)
            ) {
              existing.priority.push(skill.improvementPriority);
            }
            weakSkillsMap.set(skillName, existing);
          }
        });
      }
    });

    // Sort by frequency and get top common skills
    const commonMissingSkills = Array.from(missingSkillsMap.entries())
      .map(([skillName, data]) => ({
        skillName,
        frequency: data.count,
        percentage: Math.round((data.count / analyses.length) * 100),
        importance: data.importance,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    const commonWeakSkills = Array.from(weakSkillsMap.entries())
      .map(([skillName, data]) => ({
        skillName,
        frequency: data.count,
        percentage: Math.round((data.count / analyses.length) * 100),
        priority: data.priority,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    // Format job analyses
    const jobs = analyses.map((analysis) => ({
      jobId: analysis.job_id,
      jobTitle: analysis.job_opportunity.title,
      companyName: analysis.job_opportunity.company,
      industry: analysis.job_opportunity.industry,
      overallGapScore: analysis.overall_gap_score,
      analysisDate: analysis.analysis_date,
      matchedSkillsCount: Array.isArray(analysis.matched_skills)
        ? (analysis.matched_skills as any[]).length
        : 0,
      missingSkillsCount: Array.isArray(analysis.missing_skills)
        ? (analysis.missing_skills as any[]).length
        : 0,
      weakSkillsCount: Array.isArray(analysis.weak_skills)
        ? (analysis.weak_skills as any[]).length
        : 0,
    }));

    // Calculate skill frequency across all jobs
    const skillFrequency: Record<string, number> = {};
    analyses.forEach((analysis) => {
      const matchedSkills = analysis.matched_skills as any[];
      if (Array.isArray(matchedSkills)) {
        matchedSkills.forEach((skill: any) => {
          const skillName = skill.skillName || skill.skill_name || "";
          if (skillName) {
            skillFrequency[skillName] = (skillFrequency[skillName] || 0) + 1;
          }
        });
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalJobs: analyses.length,
        averageGapScore,
        jobs,
        commonMissingSkills,
        commonWeakSkills,
        skillFrequency,
      },
    });
  } catch (error) {
    console.error("[Get Skills Gap Trends Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to get skills gap trends"
    );
  }
};

/**
 * Extract job information from a job posting URL
 * POST /api/ai/job/extract-from-url
 */
export const extractJobFromUrl = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      sendErrorResponse(res, 400, "BAD_REQUEST", "URL is required");
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      sendErrorResponse(res, 400, "BAD_REQUEST", "Invalid URL format");
      return;
    }

    const extractedData = await aiService.extractJobFromUrl(url);

    res.status(200).json({
      success: true,
      data: extractedData,
    });
  } catch (error: any) {
    console.error("[Extract Job From URL Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      error.message || "Failed to extract job from URL"
    );
  }
};

export const analyzeInterviewResponse = async (req: Request, res: Response) => {
  try {
    const { question, questionCategory, response, jobTitle, companyName } = req.body;

    if (!question || !questionCategory || !response) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await aiService.analyzeInterviewResponse({
      question,
      questionCategory,
      response,
      jobTitle,
      companyName
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("[Interview Analysis Controller Error]", error);
    return res.status(500).json({ error: "Failed to analyze interview response" });
  }
};


/**
 * Generate mock interview questions
 * POST /api/ai/mock-interview/generate-questions
 */
export const generateMockInterviewQuestions = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { jobTitle, companyName, jobDescription, insightsData, numberOfQuestions } = req.body;

    if (!jobTitle || !companyName) {
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Job title and company name are required",
        [
          { field: "jobTitle", message: "Job title is required" },
          { field: "companyName", message: "Company name is required" }
        ]
      );
      return;
    }

    console.log(`[Mock Interview] Generating questions for ${jobTitle} at ${companyName}`);

    const questions = await aiService.generateMockInterviewQuestions({
      jobTitle,
      companyName,
      jobDescription,
      insightsData,
      numberOfQuestions: numberOfQuestions || 5
    });

    res.status(200).json({
      success: true,
      data: { questions }
    });
  } catch (error: any) {
    console.error("[Generate Mock Interview Questions Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      error.message || "Failed to generate interview questions"
    );
  }
};

/**
 * Evaluate a mock interview response
 * POST /api/ai/mock-interview/evaluate-response
 */
export const evaluateMockInterviewResponse = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const {
      question,
      category,
      difficulty,
      expectedPoints,
      userResponse,
      jobTitle,
      companyName
    } = req.body;


    if (!question || !category || !userResponse || !jobTitle || !companyName) {
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Missing required fields",
        [
          { field: "question", message: "Question is required" },
          { field: "category", message: "Category is required" },
          { field: "userResponse", message: "User response is required" },
          { field: "jobTitle", message: "Job title is required" },
          { field: "companyName", message: "Company name is required" }
        ]
      );
      return;
    }

    console.log(`[Mock Interview] Evaluating response for question: ${question.substring(0, 50)}...`);

    const feedback = await aiService.evaluateMockInterviewResponse({
      question,
      category,
      difficulty: difficulty || 'medium',
      expectedPoints,
      userResponse,
      jobTitle,
      companyName
    });

    res.status(200).json({
      success: true,
      data: { feedback }
    });
  } catch (error: any) {
    console.error("[Evaluate Mock Interview Response Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      error.message || "Failed to evaluate response"
    );
  }
};

/**
 * Generate mock interview performance summary
 * POST /api/ai/mock-interview/generate-summary
 */
export const generateMockInterviewSummary = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { jobTitle, companyName, responses } = req.body;

    if (!jobTitle || !companyName || !responses || !Array.isArray(responses)) {
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Missing required fields",
        [
          { field: "jobTitle", message: "Job title is required" },
          { field: "companyName", message: "Company name is required" },
          { field: "responses", message: "Responses array is required" }
        ]
      );
      return;
    }

    if (responses.length === 0) {
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "At least one response is required"
      );
      return;
    }

    console.log(`[Mock Interview] Generating summary for ${responses.length} responses`);

    const summary = await aiService.generateMockInterviewSummary({
      jobTitle,
      companyName,
      responses
    });

    res.status(200).json({
      success: true,
      data: { summary }
    });
  } catch (error: any) {
    console.error("[Generate Mock Interview Summary Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      error.message || "Failed to generate performance summary"
    );
  }
};