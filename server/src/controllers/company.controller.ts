// controllers/company.controller.ts
import { Request, Response } from "express-serve-static-core";
import { prisma } from "../db";
import { Prisma } from "@prisma/client";
import {
  validateCompany,
  validateCompanyUpdate,
} from "../validators/company.validator";
import { sendErrorResponse } from "../utils/errorResponse";
import { aiService } from "../services/aiService";
import { AuthRequest } from "../middleware/auth.middleware";

export const createCompany = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const validationErrors = validateCompany(req.body);
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

    const company = await prisma.company.create({
      data: req.body,
    });
    res.status(201).json(company);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        sendErrorResponse(
          res,
          409,
          "DUPLICATE_ENTRY",
          "A company with this name may already exist"
        );
        return;
      }
    }
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to create company");
  }
};

export const getCompany = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        jobOpportunities: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!company) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Company not found");
      return;
    }

    res.json(company);
  } catch (error) {
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to fetch company");
  }
};

export const listCompanies = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { industry, search, limit = "20", offset = "0" } = req.query;

    const where: Prisma.CompanyWhereInput = {};

    if (industry) {
      where.industry = industry as string;
    }

    if (search) {
      where.name = {
        contains: search as string,
        mode: "insensitive",
      };
    }

    const companies = await prisma.company.findMany({
      where,
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      orderBy: { name: "asc" },
    });

    res.json(companies);
  } catch (error) {
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to fetch companies");
  }
};

export const updateCompany = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const existingCompany = await prisma.company.findUnique({
      where: { id },
    });

    if (!existingCompany) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Company not found");
      return;
    }

    const validationErrors = validateCompanyUpdate(req.body);
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

    const company = await prisma.company.update({
      where: { id },
      data: req.body,
    });
    res.json(company);
  } catch (error) {
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to update company");
  }
};

export const deleteCompany = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const existingCompany = await prisma.company.findUnique({
      where: { id },
    });

    if (!existingCompany) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Company not found");
      return;
    }

    await prisma.company.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to delete company");
  }
};

interface ResearchCompanyRequest {
  companyName: string;
  jobId?: string;
  additionalContext?: string;
}

interface CompanyNewsRequest {
  companyName: string;
  jobId?: string;
  focusAreas?: string[];
}

/**
 * Research a company and return comprehensive information
 * POST /api/company/research
 */
export const researchCompany = async (
  req: Request<{}, {}, ResearchCompanyRequest>,
  res: Response
): Promise<void> => {
  try {
    const { companyName, jobId, additionalContext } = req.body;

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

    // Optional: Fetch job details if jobId provided
    let jobTitle: string | undefined;
    let jobCompany: string | undefined;

    if (jobId) {
      const job = await prisma.jobOpportunity.findUnique({
        where: { id: jobId },
        select: { title: true, company: true },
      });

      if (job) {
        jobTitle = job.title;
        jobCompany = job.company;

        // If company name from job differs, note it in context
        if (
          jobCompany &&
          jobCompany.toLowerCase() !== companyName.toLowerCase()
        ) {
          console.warn(
            `[Company Research] Company name mismatch: "${companyName}" vs job company "${jobCompany}"`
          );
        }
      }
    }

    const researchInput = {
      companyName: jobCompany || companyName, // Prefer company name from job if available
      jobId,
      jobTitle,
      additionalContext,
    };

    const companyResearch = await aiService.researchCompany(researchInput);

    res.status(200).json({
      success: true,
      data: companyResearch,
    });
  } catch (error: any) {
    console.error("[Company Research Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      error.message || "Failed to research company"
    );
  }
};

/**
 * Get recent company news and updates
 * POST /api/company/news
 */
export const getCompanyNews = async (
  req: Request<{}, {}, CompanyNewsRequest>,
  res: Response
): Promise<void> => {
  try {
    const { companyName, jobId, focusAreas } = req.body;

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

    // Optional: Fetch company name from job if jobId provided
    let jobCompany: string | undefined;

    if (jobId) {
      const job = await prisma.jobOpportunity.findUnique({
        where: { id: jobId },
        select: { company: true },
      });

      if (job?.company) {
        jobCompany = job.company;
      }
    }

    const newsInput = {
      companyName: jobCompany || companyName,
      jobId,
      focusAreas: focusAreas || [],
    };

    const companyNews = await aiService.getCompanyNews(newsInput);

    res.status(200).json({
      success: true,
      data: companyNews,
    });
  } catch (error: any) {
    console.error("[Company News Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      error.message || "Failed to fetch company news"
    );
  }
};

/**
 * Research company and save to database
 * POST /api/company/research-and-save
 */
export const researchAndSaveCompany = async (
  req: Request<{}, {}, ResearchCompanyRequest>,
  res: Response
): Promise<void> => {
  try {
    const { companyName, jobId, additionalContext } = req.body;

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

    // Research the company
    let jobTitle: string | undefined;
    let jobCompany: string | undefined;

    if (jobId) {
      const job = await prisma.jobOpportunity.findUnique({
        where: { id: jobId },
        select: { title: true, company: true },
      });

      if (job) {
        jobTitle = job.title;
        jobCompany = job.company;
      }
    }

    const researchInput = {
      companyName: jobCompany || companyName,
      jobId,
      jobTitle,
      additionalContext,
    };

    const companyResearch = await aiService.researchCompany(researchInput);

    // Check if company already exists in database
    const existingCompany = await prisma.company.findFirst({
      where: {
        name: {
          equals: companyResearch.companyName,
          mode: "insensitive",
        },
      },
    });

    // Prepare contact info JSON
    const contactInfoJson = companyResearch.contactInfo
      ? {
          email: companyResearch.contactInfo.email || undefined,
          phone: companyResearch.contactInfo.phone || undefined,
          address: companyResearch.contactInfo.address || undefined,
          linkedin: companyResearch.socialMedia?.linkedin || undefined,
          twitter: companyResearch.socialMedia?.twitter || undefined,
        }
      : undefined;

    let savedCompany;

    if (existingCompany) {
      // Update existing company with new research
      savedCompany = await prisma.company.update({
        where: { id: existingCompany.id },
        data: {
          name: companyResearch.companyName,
          size: companyResearch.companySize || undefined,
          industry: companyResearch.industry || undefined,
          location: companyResearch.location || undefined,
          website: companyResearch.website || undefined,
          description: companyResearch.description || undefined,
          mission: companyResearch.mission || undefined,
          logoUrl: companyResearch.logoUrl || undefined,
          contactInfo: contactInfoJson,
          glassdoorRating: companyResearch.glassdoorRating
            ? String(companyResearch.glassdoorRating)
            : undefined,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new company record
      savedCompany = await prisma.company.create({
        data: {
          name: companyResearch.companyName,
          size: companyResearch.companySize || undefined,
          industry: companyResearch.industry || undefined,
          location: companyResearch.location || undefined,
          website: companyResearch.website || undefined,
          description: companyResearch.description || undefined,
          mission: companyResearch.mission || undefined,
          logoUrl: companyResearch.logoUrl || undefined,
          contactInfo: contactInfoJson,
          glassdoorRating: companyResearch.glassdoorRating
            ? String(companyResearch.glassdoorRating)
            : undefined,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        company: savedCompany,
        research: companyResearch,
        isNew: !existingCompany,
      },
    });
  } catch (error: any) {
    console.error("[Research and Save Company Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      error.message || "Failed to research and save company"
    );
  }
};

/**
 * Get company by ID (if already in database)
 * GET /api/company/:companyId
 */
export const getCompanyById = async (
  req: Request<{ companyId: string }>,
  res: Response
): Promise<void> => {
  try {
    const { companyId } = req.params;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        jobOpportunities: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            location: true,
            currentStatus: true,
          },
        },
      },
    });

    if (!company) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Company not found");
      return;
    }

    res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error: any) {
    console.error("[Get Company Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      error.message || "Failed to fetch company"
    );
  }
};
