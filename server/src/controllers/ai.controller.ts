import { Request, Response } from "express";
import { sendErrorResponse } from "../utils/errorResponse";
import { aiService } from "../services/aiService";
import { prisma } from "../db";
import multer from "multer";
import mammoth from "mammoth";

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
