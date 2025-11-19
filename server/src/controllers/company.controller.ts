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
import PDFDocument from "pdfkit";

// Helper function to truncate strings to database column limits
const truncateString = (str: string | null | undefined, maxLength: number): string | undefined => {
  if (!str) return undefined;
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
};

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
  forceRefresh?: boolean;
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

    // Handle case where AI service returns invalid data
    if (!companyNews || !companyNews.articles || !Array.isArray(companyNews.articles)) {
      console.error("[Company News] Invalid response from AI service:", companyNews);
      sendErrorResponse(
        res,
        500,
        "INTERNAL_ERROR",
        "AI service returned invalid news data"
      );
      return;
    }

    // Transform CompanyNewsOutput (with articles) to CompanyNewsResult (with newsItems)
    // to match expected frontend format
    // Note: Backend NewsItem type doesn't have "hiring" but frontend does, so we map it
    const categoryMap: Record<string, "product_launch" | "funding" | "acquisition" | "partnership" | "leadership_change" | "expansion" | "financial_results" | "controversy" | "award" | "other"> = {
      product_launch: "product_launch",
      funding: "funding",
      acquisition: "acquisition",
      partnership: "partnership",
      leadership_change: "leadership_change",
      award: "award",
      hiring: "other", // Backend NewsItem type doesn't support "hiring", map to "other"
      general: "other",
      expansion: "expansion",
      financial_results: "financial_results",
      controversy: "controversy",
    };

    // Helper to generate Google search URL if no real URL provided
    const generateGoogleSearchUrl = (headline: string, companyName: string): string => {
      const searchQuery = encodeURIComponent(`${companyName} ${headline}`);
      return `https://www.google.com/search?q=${searchQuery}`;
    };

    const transformedNews = {
      companyName: jobCompany || companyName,
      newsItems: companyNews.articles.map((article) => {
        // Always generate Google search URL to avoid hallucinated links
        const articleUrl = generateGoogleSearchUrl(article.title, jobCompany || companyName);

        return {
          headline: article.title,
          summary: article.summary,
          date: article.publishDate,
          category: categoryMap[article.category] || "other",
          sentiment: "positive" as const, // Default to positive since we don't have sentiment in schema
          relevanceScore: article.relevanceScore,
          source: article.source,
          url: articleUrl,
        };
      }),
      lastUpdated: companyNews.researchDate,
    };

    res.status(200).json({
      success: true,
      data: transformedNews,
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
 * Refresh company news (force new AI call)
 * POST /api/companies/:companyId/news/refresh
 */
export const refreshCompanyNews = async (
  req: Request<{ companyId: string }>,
  res: Response
): Promise<void> => {
  try {
    const { companyId } = req.params;
    const { focusAreas } = req.body;

    // Get company name from database
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    });

    if (!company) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Company not found");
      return;
    }

    const newsInput = {
      companyName: company.name,
      focusAreas: focusAreas || [],
    };

    const companyNews = await aiService.getCompanyNews(newsInput);

    // Handle case where AI service returns invalid data
    if (!companyNews || !companyNews.articles || !Array.isArray(companyNews.articles)) {
      console.error("[Company News Refresh] Invalid response from AI service:", companyNews);
      sendErrorResponse(
        res,
        500,
        "INTERNAL_ERROR",
        "AI service returned invalid news data"
      );
      return;
    }

    // TODO: Save to company_news table when caching is implemented
    // For now, just return the fresh data

    const categoryMap: Record<string, "product_launch" | "funding" | "acquisition" | "partnership" | "leadership_change" | "expansion" | "financial_results" | "controversy" | "award" | "other"> = {
      product_launch: "product_launch",
      funding: "funding",
      acquisition: "acquisition",
      partnership: "partnership",
      leadership_change: "leadership_change",
      award: "award",
      hiring: "other",
      general: "other",
      expansion: "expansion",
      financial_results: "financial_results",
      controversy: "controversy",
    };

    const generateGoogleSearchUrl = (headline: string, companyName: string): string => {
      const searchQuery = encodeURIComponent(`${companyName} ${headline}`);
      return `https://www.google.com/search?q=${searchQuery}`;
    };

    const transformedNews = {
      companyName: company.name,
      newsItems: companyNews.articles.map((article) => {
        // Always generate Google search URL to avoid hallucinated links
        const articleUrl = generateGoogleSearchUrl(article.title, company.name);

        return {
          headline: article.title,
          summary: article.summary,
          date: article.publishDate,
          category: categoryMap[article.category] || "other",
          sentiment: "positive" as const,
          relevanceScore: article.relevanceScore,
          source: article.source,
          url: articleUrl,
        };
      }),
      lastUpdated: companyNews.researchDate,
    };

    res.status(200).json({
      success: true,
      data: transformedNews,
    });
  } catch (error: any) {
    console.error("[Company News Refresh Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      error.message || "Failed to refresh company news"
    );
  }
};

/**
 * Export company news (CSV or PDF)
 * GET /api/companies/:companyId/news/export?format=csv|pdf&category=...&search=...
 */
export const exportCompanyNews = async (
  req: Request<{ companyId: string }, {}, {}, { format?: string; category?: string; search?: string }>,
  res: Response
): Promise<void> => {
  try {
    const { companyId } = req.params;
    const { format = "csv", category, search } = req.query;

    // Get company name
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    });

    if (!company) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Company not found");
      return;
    }

    // TODO: When company_news table is populated, fetch from there
    // For now, fetch fresh news
    const newsInput = {
      companyName: company.name,
    };

    const companyNews = await aiService.getCompanyNews(newsInput);

    if (!companyNews || !companyNews.articles || !Array.isArray(companyNews.articles)) {
      sendErrorResponse(
        res,
        500,
        "INTERNAL_ERROR",
        "Failed to fetch company news for export"
      );
      return;
    }

    // Filter news based on query params
    let filteredNews = companyNews.articles;

    if (category && category !== "all") {
      // Map frontend category names to backend category names
      const categoryReverseMap: Record<string, string[]> = {
        product_launch: ["product_launch"],
        funding: ["funding"],
        acquisition: ["acquisition"],
        partnership: ["partnership"],
        leadership_change: ["leadership_change"],
        award: ["award"],
        other: ["hiring", "general", "expansion", "financial_results", "controversy"],
      };
      
      const backendCategories = categoryReverseMap[category] || [category];
      filteredNews = filteredNews.filter((article) => 
        backendCategories.includes(article.category)
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredNews = filteredNews.filter(
        (article) =>
          article.title.toLowerCase().includes(searchLower) ||
          article.summary.toLowerCase().includes(searchLower) ||
          article.source.toLowerCase().includes(searchLower)
      );
    }

    const categoryMap: Record<string, string> = {
      product_launch: "Product Launch",
      funding: "Funding",
      acquisition: "Acquisition",
      partnership: "Partnership",
      leadership_change: "Leadership Change",
      award: "Award",
      hiring: "Hiring",
      general: "General",
      expansion: "Expansion",
      financial_results: "Financial Results",
      controversy: "Controversy",
    };

    if (format === "pdf") {
      // Generate PDF
      const doc = new PDFDocument({ margin: 50 });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${company.name}_news_${new Date().toISOString().split("T")[0]}.pdf"`
      );

      doc.pipe(res);

      // Header
      doc.fontSize(20).text(`${company.name} - Company News`, { align: "center" });
      doc.moveDown();
      doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, { align: "center" });
      doc.moveDown(2);

      // News items
      filteredNews.forEach((article, index) => {
        if (index > 0) {
          doc.moveDown();
          doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
          doc.moveDown();
        }

        doc.fontSize(14).font("Helvetica-Bold").text(article.title, { continued: false });
        doc.moveDown(0.5);

        doc.fontSize(10).font("Helvetica").fillColor("#666666");
        doc.text(`Source: ${article.source} | Date: ${article.publishDate} | Category: ${categoryMap[article.category] || article.category}`);
        doc.moveDown(0.5);

        doc.fontSize(11).fillColor("#000000");
        doc.text(`Relevance: ${article.relevanceScore}%`, { continued: true });
        doc.fillColor("#0066cc");
        doc.text(` | URL: ${article.url || "N/A"}`);
        doc.fillColor("#000000");
        doc.moveDown(0.5);

        doc.fontSize(11).text(article.summary);
        doc.moveDown(0.5);

        if (article.keyPoints && article.keyPoints.length > 0) {
          doc.fontSize(10).font("Helvetica-Bold").text("Key Points:");
          article.keyPoints.forEach((point: string) => {
            doc.fontSize(10).font("Helvetica").text(`• ${point}`, { indent: 20 });
          });
        }
      });

      doc.end();
    } else {
      // Generate CSV
      const csvRows = [
        ["Title", "Source", "Date", "Category", "Relevance Score", "URL", "Summary"],
        ...filteredNews.map((article) => [
          `"${article.title.replace(/"/g, '""')}"`,
          `"${article.source.replace(/"/g, '""')}"`,
          `"${article.publishDate}"`,
          `"${categoryMap[article.category] || article.category}"`,
          article.relevanceScore.toString(),
          `"${(article.url || "").replace(/"/g, '""')}"`,
          `"${article.summary.replace(/"/g, '""')}"`,
        ]),
      ];

      const csvContent = csvRows.map((row) => row.join(",")).join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${company.name}_news_${new Date().toISOString().split("T")[0]}.csv"`
      );

      res.send(csvContent);
    }
  } catch (error: any) {
    console.error("[Company News Export Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      error.message || "Failed to export company news"
    );
  }
};

/**
 * Refresh company news by company name (alternative endpoint)
 * POST /api/companies/news/refresh
 */
export const refreshCompanyNewsByName = async (
  req: Request<{}, {}, { companyName: string; focusAreas?: string[] }>,
  res: Response
): Promise<void> => {
  try {
    const { companyName, focusAreas } = req.body;

    if (!companyName) {
      sendErrorResponse(res, 400, "VALIDATION_ERROR", "Company name is required");
      return;
    }

    const newsInput = {
      companyName,
      focusAreas: focusAreas || [],
    };

    const companyNews = await aiService.getCompanyNews(newsInput);

    if (!companyNews || !companyNews.articles || !Array.isArray(companyNews.articles)) {
      console.error("[Company News Refresh] Invalid response from AI service:", companyNews);
      sendErrorResponse(
        res,
        500,
        "INTERNAL_ERROR",
        "AI service returned invalid news data"
      );
      return;
    }

    const categoryMap: Record<string, "product_launch" | "funding" | "acquisition" | "partnership" | "leadership_change" | "expansion" | "financial_results" | "controversy" | "award" | "other"> = {
      product_launch: "product_launch",
      funding: "funding",
      acquisition: "acquisition",
      partnership: "partnership",
      leadership_change: "leadership_change",
      award: "award",
      hiring: "other",
      general: "other",
      expansion: "expansion",
      financial_results: "financial_results",
      controversy: "controversy",
    };

    const generateGoogleSearchUrl = (headline: string, companyName: string): string => {
      const searchQuery = encodeURIComponent(`${companyName} ${headline}`);
      return `https://www.google.com/search?q=${searchQuery}`;
    };

    const transformedNews = {
      companyName,
      newsItems: companyNews.articles.map((article) => {
        // Always generate Google search URL to avoid hallucinated links
        const articleUrl = generateGoogleSearchUrl(article.title, companyName);

        return {
          headline: article.title,
          summary: article.summary,
          date: article.publishDate,
          category: categoryMap[article.category] || "other",
          sentiment: "positive" as const,
          relevanceScore: article.relevanceScore,
          source: article.source,
          url: articleUrl,
        };
      }),
      lastUpdated: companyNews.researchDate,
    };

    res.status(200).json({
      success: true,
      data: transformedNews,
    });
  } catch (error: any) {
    console.error("[Company News Refresh Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      error.message || "Failed to refresh company news"
    );
  }
};

/**
 * Export company news by company name (alternative endpoint)
 * GET /api/companies/news/export?companyName=...&format=csv|pdf&category=...&search=...
 */
export const exportCompanyNewsByName = async (
  req: Request<{}, {}, {}, { companyName?: string; format?: string; category?: string; search?: string }>,
  res: Response
): Promise<void> => {
  try {
    const { companyName, format = "csv", category, search } = req.query;

    if (!companyName) {
      sendErrorResponse(res, 400, "VALIDATION_ERROR", "Company name is required");
      return;
    }

    // Fetch fresh news
    const newsInput = {
      companyName: companyName as string,
    };

    const companyNews = await aiService.getCompanyNews(newsInput);

    if (!companyNews || !companyNews.articles || !Array.isArray(companyNews.articles)) {
      sendErrorResponse(
        res,
        500,
        "INTERNAL_ERROR",
        "Failed to fetch company news for export"
      );
      return;
    }

    // Filter news based on query params
    let filteredNews = companyNews.articles;

    if (category && category !== "all") {
      const categoryReverseMap: Record<string, string[]> = {
        product_launch: ["product_launch"],
        funding: ["funding"],
        acquisition: ["acquisition"],
        partnership: ["partnership"],
        leadership_change: ["leadership_change"],
        award: ["award"],
        other: ["hiring", "general", "expansion", "financial_results", "controversy"],
      };
      
      const backendCategories = categoryReverseMap[category] || [category];
      filteredNews = filteredNews.filter((article) => 
        backendCategories.includes(article.category)
      );
    }

    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredNews = filteredNews.filter(
        (article) =>
          article.title.toLowerCase().includes(searchLower) ||
          article.summary.toLowerCase().includes(searchLower) ||
          article.source.toLowerCase().includes(searchLower)
      );
    }

    const categoryMap: Record<string, string> = {
      product_launch: "Product Launch",
      funding: "Funding",
      acquisition: "Acquisition",
      partnership: "Partnership",
      leadership_change: "Leadership Change",
      award: "Award",
      hiring: "Hiring",
      general: "General",
      expansion: "Expansion",
      financial_results: "Financial Results",
      controversy: "Controversy",
    };

    if (format === "pdf") {
      const doc = new PDFDocument({ margin: 50 });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${companyName}_news_${new Date().toISOString().split("T")[0]}.pdf"`
      );

      doc.pipe(res);

      doc.fontSize(20).text(`${companyName} - Company News`, { align: "center" });
      doc.moveDown();
      doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, { align: "center" });
      doc.moveDown(2);

      filteredNews.forEach((article, index) => {
        if (index > 0) {
          doc.moveDown();
          doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
          doc.moveDown();
        }

        doc.fontSize(14).font("Helvetica-Bold").text(article.title, { continued: false });
        doc.moveDown(0.5);

        doc.fontSize(10).font("Helvetica").fillColor("#666666");
        doc.text(`Source: ${article.source} | Date: ${article.publishDate} | Category: ${categoryMap[article.category] || article.category}`);
        doc.moveDown(0.5);

        doc.fontSize(11).fillColor("#000000");
        doc.text(`Relevance: ${article.relevanceScore}%`, { continued: true });
        doc.fillColor("#0066cc");
        doc.text(` | URL: ${article.url || "N/A"}`);
        doc.fillColor("#000000");
        doc.moveDown(0.5);

        doc.fontSize(11).text(article.summary);
        doc.moveDown(0.5);

        if (article.keyPoints && article.keyPoints.length > 0) {
          doc.fontSize(10).font("Helvetica-Bold").text("Key Points:");
          article.keyPoints.forEach((point: string) => {
            doc.fontSize(10).font("Helvetica").text(`• ${point}`, { indent: 20 });
          });
        }
      });

      doc.end();
    } else {
      const csvRows = [
        ["Title", "Source", "Date", "Category", "Relevance Score", "URL", "Summary"],
        ...filteredNews.map((article) => [
          `"${article.title.replace(/"/g, '""')}"`,
          `"${article.source.replace(/"/g, '""')}"`,
          `"${article.publishDate}"`,
          `"${categoryMap[article.category] || article.category}"`,
          article.relevanceScore.toString(),
          `"${(article.url || "").replace(/"/g, '""')}"`,
          `"${article.summary.replace(/"/g, '""')}"`,
        ]),
      ];

      const csvContent = csvRows.map((row) => row.join(",")).join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${companyName}_news_${new Date().toISOString().split("T")[0]}.csv"`
      );

      res.send(csvContent);
    }
  } catch (error: any) {
    console.error("[Company News Export Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      error.message || "Failed to export company news"
    );
  }
};

/**
 * Transform database Company model to CompanyResearchOutput format
 */
const transformCompanyToResearch = (company: any) => {
  const contactInfo = company.contactInfo as any;
  
  // Handle JSON fields - Prisma might return them as objects or strings
  let leadership = company.leadership || null;
  let productsAndServices = company.products_and_services || null;
  
  // If leadership is a string, parse it
  if (typeof leadership === 'string') {
    try {
      leadership = JSON.parse(leadership);
    } catch (e) {
      console.warn('[Transform] Failed to parse leadership JSON:', e);
      leadership = null;
    }
  }
  
  // If productsAndServices is a string, parse it
  if (typeof productsAndServices === 'string') {
    try {
      productsAndServices = JSON.parse(productsAndServices);
    } catch (e) {
      console.warn('[Transform] Failed to parse productsAndServices JSON:', e);
      productsAndServices = null;
    }
  }
  
  // Ensure arrays are actually arrays
  if (leadership && !Array.isArray(leadership)) {
    console.warn('[Transform] Leadership is not an array:', typeof leadership, leadership);
    leadership = null;
  }
  
  if (productsAndServices && !Array.isArray(productsAndServices)) {
    console.warn('[Transform] ProductsAndServices is not an array:', typeof productsAndServices, productsAndServices);
    productsAndServices = null;
  }
  
  return {
    companyName: company.name,
    companySize: company.size || null,
    industry: company.industry || null,
    location: company.location || null,
    website: company.website || null,
    description: company.description || null,
    mission: company.mission || null,
    logoUrl: company.logoUrl || null,
    contactInfo: contactInfo
      ? {
          email: contactInfo.email || null,
          phone: contactInfo.phone || null,
          address: contactInfo.address || null,
        }
      : null,
    glassdoorRating: company.glassdoorRating
      ? parseFloat(company.glassdoorRating)
      : null,
    socialMedia: contactInfo
      ? {
          linkedin: contactInfo.linkedin || null,
          twitter: contactInfo.twitter || null,
        }
      : null,
    leadership: leadership, // Array of {name, title} objects
    productsAndServices: productsAndServices, // Array of strings - using snake_case from schema
    competitiveLandscape: company.competitive_landscape || null, // Using snake_case from schema
  };
};

/**
 * Research company and save to database
 * POST /api/company/research-and-save
 * 
 * Implements caching: checks database first, only calls AI if:
 * - Company doesn't exist, OR
 * - Company data is older than 7 days
 */
export const researchAndSaveCompany = async (
  req: Request<{}, {}, ResearchCompanyRequest>,
  res: Response
): Promise<void> => {
  try {
    const { companyName, jobId, additionalContext, forceRefresh } = req.body;

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

    // Get company name from job if available
    let jobTitle: string | undefined;
    let jobCompany: string | undefined;
    let existingCompanyId: string | undefined;

    if (jobId) {
      const job = await prisma.jobOpportunity.findUnique({
        where: { id: jobId },
        select: { title: true, company: true, companyId: true },
      });

      if (job) {
        jobTitle = job.title;
        jobCompany = job.company;
        existingCompanyId = job.companyId || undefined;
      }
    }

    const targetCompanyName = jobCompany || companyName;

    // If job already has a companyId, use that directly (fastest path)
    if (existingCompanyId) {
      const companyById = await prisma.company.findUnique({
        where: { id: existingCompanyId },
      });

      if (companyById) {
        const now = new Date();
        const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
        let isDataFresh = false;
        
        if (companyById.updatedAt) {
          isDataFresh = now.getTime() - companyById.updatedAt.getTime() < CACHE_DURATION_MS;
        } else if (companyById.createdAt) {
          isDataFresh = now.getTime() - companyById.createdAt.getTime() < CACHE_DURATION_MS;
        }

        if (!forceRefresh && isDataFresh) {
          const daysAgo = companyById.updatedAt
            ? Math.floor((now.getTime() - companyById.updatedAt.getTime()) / (1000 * 60 * 60 * 24))
            : companyById.createdAt
            ? Math.floor((now.getTime() - companyById.createdAt.getTime()) / (1000 * 60 * 60 * 24))
            : 0;
          
          console.log(
            `[Company Research] ✅ Using cached data via companyId for "${companyById.name}" (updated ${daysAgo} days ago)`
          );
          
          res.status(200).json({
            success: true,
            data: {
              company: companyById,
              research: transformCompanyToResearch(companyById),
              isNew: false,
              fromCache: true,
            },
          });
          return;
        } else {
          console.log(
            `[Company Research] Found company by ID but cache expired, will refresh`
          );
        }
      }
    }

    // Helper function to normalize website URLs for comparison
    const normalizeWebsite = (url: string | null | undefined): string | null => {
      if (!url) return null;
      return url
        .toLowerCase()
        .replace(/^https?:\/\//, '') // Remove http:// or https://
        .replace(/^www\./, '') // Remove www.
        .replace(/\/$/, '') // Remove trailing slash
        .trim();
    };

    // Cache duration: 7 days (in milliseconds)
    const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
    const now = new Date();

    // Check database first for caching - try by name AND website
    let existingCompany = await prisma.company.findFirst({
      where: {
        OR: [
          {
            name: {
              equals: targetCompanyName,
              mode: "insensitive",
            },
          },
          // Also check if we can find by website (if we have website info from job)
          // Note: We'll check by website after AI call too
        ],
      },
    });

    // Check if data is fresh (skip if forceRefresh is true)
    let isDataFresh = false;
    if (!forceRefresh && existingCompany?.updatedAt) {
      const timeDiff = now.getTime() - existingCompany.updatedAt.getTime();
      isDataFresh = timeDiff < CACHE_DURATION_MS;
    } else if (!forceRefresh && existingCompany?.createdAt) {
      // Fallback to createdAt if updatedAt is null
      const timeDiff = now.getTime() - existingCompany.createdAt.getTime();
      isDataFresh = timeDiff < CACHE_DURATION_MS;
    }
    
    // Check if cached data is "complete" - has at least one of the key fields
    // This helps catch old cached data that only has mission/values
    const hasCompleteData = existingCompany && (
      (existingCompany.products_and_services && 
       (Array.isArray(existingCompany.products_and_services) ? existingCompany.products_and_services.length > 0 : true)) ||
      (existingCompany.leadership && 
       (Array.isArray(existingCompany.leadership) ? existingCompany.leadership.length > 0 : true)) ||
      (existingCompany.competitive_landscape && 
       typeof existingCompany.competitive_landscape === 'string' && 
       existingCompany.competitive_landscape.trim().length > 0)
    );
    
    // If data is fresh but incomplete, log a warning and treat as stale for better UX
    if (isDataFresh && !hasCompleteData && existingCompany) {
      console.log(
        `[Company Research] ⚠️ Cached data exists but appears incomplete (missing products/services, leadership, or competitive landscape). Treating as stale.`
      );
      isDataFresh = false; // Force refresh to get complete data
    }

    let companyResearch;
    let savedCompany;
    let isNew = false;
    let fromCache = false;

    if (!forceRefresh && existingCompany && isDataFresh) {
      // Return cached data - no AI call needed
      const daysAgo = existingCompany.updatedAt
        ? Math.floor((now.getTime() - existingCompany.updatedAt.getTime()) / (1000 * 60 * 60 * 24))
        : existingCompany.createdAt
        ? Math.floor((now.getTime() - existingCompany.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      
          console.log(
            `[Company Research] ✅ Using cached data for "${targetCompanyName}" (updated ${daysAgo} days ago, ID: ${existingCompany.id})`
          );
      savedCompany = existingCompany;
      companyResearch = transformCompanyToResearch(existingCompany);
      
      // Log what's being returned from cache
      console.log('[Company Research] Cached data being returned:', {
        companyName: companyResearch.companyName,
        hasDescription: !!companyResearch.description,
        hasMission: !!companyResearch.mission,
        hasProductsAndServices: !!companyResearch.productsAndServices,
        productsAndServicesCount: companyResearch.productsAndServices?.length || 0,
        hasLeadership: !!companyResearch.leadership,
        leadershipCount: companyResearch.leadership?.length || 0,
        hasCompetitiveLandscape: !!companyResearch.competitiveLandscape,
        databaseProductsAndServices: existingCompany.products_and_services,
        databaseCompetitiveLandscape: existingCompany.competitive_landscape,
        databaseLeadership: existingCompany.leadership,
      });
      
      fromCache = true;
    } else {
      // Data is stale or doesn't exist - call AI
      console.log(
        `[Company Research] Fetching fresh data for "${targetCompanyName}"${
          existingCompany ? " (cache expired)" : " (new company)"
        }`
      );

      const researchInput = {
        companyName: targetCompanyName,
        jobId,
        jobTitle,
        additionalContext,
      };

      companyResearch = await aiService.researchCompany(researchInput);
      
      // Log AI response to debug what fields are being returned
      console.log('[Company Research] AI Response received:', {
        companyName: companyResearch.companyName,
        hasDescription: !!companyResearch.description,
        hasMission: !!companyResearch.mission,
        hasProductsAndServices: !!companyResearch.productsAndServices,
        productsAndServicesCount: companyResearch.productsAndServices?.length || 0,
        hasLeadership: !!companyResearch.leadership,
        leadershipCount: companyResearch.leadership?.length || 0,
        hasCompetitiveLandscape: !!companyResearch.competitiveLandscape,
        hasLogoUrl: !!companyResearch.logoUrl,
        hasContactInfo: !!companyResearch.contactInfo,
        fullResponse: JSON.stringify(companyResearch, null, 2),
      });

      // After AI call, check cache again using BOTH AI-returned name AND website
      // This catches cases where names vary but website is the same
      const aiCompanyName = companyResearch.companyName;
      const aiWebsite = normalizeWebsite(companyResearch.website || null);
      
      let companyToUpdate = existingCompany;
      let foundByWebsite = false;

      // Build search conditions
      const searchConditions: any[] = [];
      
      // Search by AI-returned name
      if (aiCompanyName) {
        searchConditions.push({
          name: {
            equals: aiCompanyName,
            mode: "insensitive",
          },
        });
      }
      
      // Search by website (most reliable identifier)
      // Try multiple variations of the website URL
      if (aiWebsite) {
        // Try to find by website using contains (case-insensitive)
        // We'll check multiple variations since URLs can be stored differently
        const websiteVariations = [
          aiWebsite,
          `https://${aiWebsite}`,
          `http://${aiWebsite}`,
          `https://www.${aiWebsite}`,
          `http://www.${aiWebsite}`,
        ];

        for (const variation of websiteVariations) {
          const companyByWebsite = await prisma.company.findFirst({
            where: {
              website: {
                contains: aiWebsite,
                mode: "insensitive",
              },
            },
          });

          if (companyByWebsite) {
            // Double-check with normalized comparison
            const companyWebsite = normalizeWebsite(companyByWebsite.website);
            if (companyWebsite === aiWebsite) {
              companyToUpdate = companyByWebsite;
              foundByWebsite = true;
              console.log(
                `[Company Research] 🔍 Found company by website match: "${companyByWebsite.name}" (website: ${companyByWebsite.website})`
              );
              break;
            }
          }
        }
      }

      // If not found by website, try by AI name
      if (!companyToUpdate && aiCompanyName) {
        const companyByAiName = await prisma.company.findFirst({
          where: {
            name: {
              equals: aiCompanyName,
              mode: "insensitive",
            },
          },
        });
        
        if (companyByAiName) {
          companyToUpdate = companyByAiName;
          console.log(
            `[Company Research] 🔍 Found company by AI name: "${aiCompanyName}"`
          );
        }
      }

      // IMPORTANT: After calling AI, we should ALWAYS use the AI response, not cached data
      // The cached data check happens BEFORE calling AI (above). Once we call AI, we have fresh data
      // and should use it, even if we find an existing company in the database.
      // We'll update the existing company with the fresh AI data below.
      
      if (companyToUpdate) {
        console.log(
          `[Company Research] 🔄 Found existing company "${companyToUpdate.name}" in database. Will update with fresh AI data.`
        );
      }

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

      if (companyToUpdate) {
        // Update existing company with new research
        savedCompany = await prisma.company.update({
          where: { id: companyToUpdate.id },
          data: {
            name: truncateString(companyResearch.companyName, 255) || companyToUpdate.name, // Required field, fallback to existing
            size: truncateString(companyResearch.companySize, 50), // VarChar(50)
            industry: truncateString(companyResearch.industry, 100), // VarChar(100)
            location: truncateString(companyResearch.location, 255), // VarChar(255)
            website: truncateString(companyResearch.website, 500), // VarChar(500)
            description: companyResearch.description || undefined, // TEXT (unlimited)
            mission: companyResearch.mission || undefined, // TEXT (unlimited)
            logoUrl: truncateString(companyResearch.logoUrl, 500), // VarChar(500)
            contactInfo: contactInfoJson,
            glassdoorRating: companyResearch.glassdoorRating
              ? String(companyResearch.glassdoorRating)
              : undefined,
            leadership: companyResearch.leadership ? JSON.parse(JSON.stringify(companyResearch.leadership)) : undefined,
            products_and_services: companyResearch.productsAndServices ? JSON.parse(JSON.stringify(companyResearch.productsAndServices)) : undefined,
            competitive_landscape: companyResearch.competitiveLandscape || undefined, // TEXT (unlimited)
            updatedAt: new Date(),
          },
        });
        
        // Log what was saved to database
        console.log('[Company Research] Updated company in database:', {
          id: savedCompany.id,
          name: savedCompany.name,
          hasProductsAndServices: !!savedCompany.products_and_services,
          productsAndServicesValue: savedCompany.products_and_services,
          hasCompetitiveLandscape: !!savedCompany.competitive_landscape,
          competitiveLandscapeValue: savedCompany.competitive_landscape,
          hasLeadership: !!savedCompany.leadership,
          leadershipValue: savedCompany.leadership,
        });
      } else {
        // Create new company record
        // Truncate fields to match database column limits
        savedCompany = await prisma.company.create({
          data: {
            name: truncateString(companyResearch.companyName, 255) || 'Unknown Company', // Required field
            size: truncateString(companyResearch.companySize, 50), // VarChar(50)
            industry: truncateString(companyResearch.industry, 100), // VarChar(100)
            location: truncateString(companyResearch.location, 255), // VarChar(255)
            website: truncateString(companyResearch.website, 500), // VarChar(500)
            description: companyResearch.description || undefined, // TEXT (unlimited)
            mission: companyResearch.mission || undefined, // TEXT (unlimited)
            logoUrl: truncateString(companyResearch.logoUrl, 500), // VarChar(500)
            contactInfo: contactInfoJson,
            glassdoorRating: companyResearch.glassdoorRating
              ? String(companyResearch.glassdoorRating)
              : undefined,
            leadership: companyResearch.leadership ? JSON.parse(JSON.stringify(companyResearch.leadership)) : undefined,
            products_and_services: companyResearch.productsAndServices ? JSON.parse(JSON.stringify(companyResearch.productsAndServices)) : undefined,
            competitive_landscape: companyResearch.competitiveLandscape || undefined, // TEXT (unlimited)
          },
        });
        
        // Log what was saved to database
        console.log('[Company Research] Created new company in database:', {
          id: savedCompany.id,
          name: savedCompany.name,
          hasProductsAndServices: !!savedCompany.products_and_services,
          productsAndServicesValue: savedCompany.products_and_services,
          hasCompetitiveLandscape: !!savedCompany.competitive_landscape,
          competitiveLandscapeValue: savedCompany.competitive_landscape,
          hasLeadership: !!savedCompany.leadership,
          leadershipValue: savedCompany.leadership,
        });
        
        isNew = true;
      }
      
      // IMPORTANT: Use the AI response directly instead of re-reading from database
      // The AI response is already in the correct format and contains all the data
      // Re-transforming from database can cause data loss or format issues
      // Only transform from database when using cached data (which we handle above)
      
      // Log final response being sent (using AI response directly)
      console.log('[Company Research] Final response being sent (from AI):', {
        companyName: companyResearch.companyName,
        hasDescription: !!companyResearch.description,
        hasMission: !!companyResearch.mission,
        hasProductsAndServices: !!companyResearch.productsAndServices,
        productsAndServicesCount: companyResearch.productsAndServices?.length || 0,
        productsAndServicesValue: companyResearch.productsAndServices,
        hasLeadership: !!companyResearch.leadership,
        leadershipCount: companyResearch.leadership?.length || 0,
        leadershipValue: companyResearch.leadership,
        hasCompetitiveLandscape: !!companyResearch.competitiveLandscape,
        competitiveLandscapeValue: companyResearch.competitiveLandscape,
      });

      // Link company to job if jobId provided
      if (jobId && savedCompany) {
        try {
          await prisma.jobOpportunity.update({
            where: { id: jobId },
            data: { companyId: savedCompany.id },
          });
          console.log(
            `[Company Research] Linked company "${savedCompany.name}" to job ${jobId}`
          );
        } catch (error) {
          // Non-fatal error - job might not exist or update might fail
          console.warn(
            `[Company Research] Failed to link company to job ${jobId}:`,
            error
          );
        }
      }
    }

    // Log the exact response being sent (before JSON serialization)
    console.log('[Company Research] About to send response:', {
      fromCache,
      isNew,
      researchKeys: Object.keys(companyResearch || {}),
      researchProductsAndServices: companyResearch?.productsAndServices,
      researchLeadership: companyResearch?.leadership,
      researchCompetitiveLandscape: companyResearch?.competitiveLandscape,
      researchType: typeof companyResearch,
      researchStringified: JSON.stringify(companyResearch).substring(0, 500),
    });
    
    const responseData = {
      success: true,
      data: {
        company: savedCompany,
        research: companyResearch,
        isNew,
        fromCache,
      },
    };
    
    // Log after creating response object to see if anything changes
    console.log('[Company Research] Response data structure:', {
      hasResearch: !!responseData.data.research,
      researchType: typeof responseData.data.research,
      researchProductsAndServices: responseData.data.research?.productsAndServices,
      researchLeadership: responseData.data.research?.leadership,
      researchCompetitiveLandscape: responseData.data.research?.competitiveLandscape,
    });
    
    res.status(200).json(responseData);
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

    // Transform database company to research format (matches CompanyResearchOutput)
    const companyData = transformCompanyToResearch(company);

    res.status(200).json({
      success: true,
      data: companyData,
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

/**
 * Follow a company
 * POST /api/companies/:companyId/follow
 */
export const followCompany = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { companyId } = req.params;

    if (!userId) {
      sendErrorResponse(res, 401, "UNAUTHORIZED", "Authentication required");
      return;
    }

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Company not found");
      return;
    }

    // Check if already following
    const existingFollow = await (prisma as any).companyFollows.findFirst({
      where: {
        userId,
        companyId,
      },
    });

    if (existingFollow) {
      res.status(200).json({
        success: true,
        message: "Already following this company",
        data: existingFollow,
      });
      return;
    }

    // Create follow relationship
    const follow = await (prisma as any).companyFollows.create({
      data: {
        userId,
        companyId,
      },
    });

    res.status(201).json({
      success: true,
      message: "Successfully followed company",
      data: follow,
    });
  } catch (error: any) {
    console.error("[Follow Company Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      error.message || "Failed to follow company"
    );
  }
};

/**
 * Unfollow a company
 * DELETE /api/companies/:companyId/follow
 */
export const unfollowCompany = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { companyId } = req.params;

    if (!userId) {
      sendErrorResponse(res, 401, "UNAUTHORIZED", "Authentication required");
      return;
    }

    // Check if following
    const existingFollow = await (prisma as any).companyFollows.findFirst({
      where: {
        userId,
        companyId,
      },
    });

    if (!existingFollow) {
      sendErrorResponse(
        res,
        404,
        "NOT_FOUND",
        "You are not following this company"
      );
      return;
    }

    // Delete follow relationship
    await (prisma as any).companyFollows.delete({
      where: {
        id: existingFollow.id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Successfully unfollowed company",
    });
  } catch (error: any) {
    console.error("[Unfollow Company Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      error.message || "Failed to unfollow company"
    );
  }
};

/**
 * Check if user is following a company
 * GET /api/companies/:companyId/follow
 */
export const checkFollowStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { companyId } = req.params;

    if (!userId) {
      sendErrorResponse(res, 401, "UNAUTHORIZED", "Authentication required");
      return;
    }

    const follow = await (prisma as any).companyFollows.findFirst({
      where: {
        userId,
        companyId,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        isFollowing: !!follow,
        followDate: follow?.createdAt || null,
      },
    });
  } catch (error: any) {
    console.error("[Check Follow Status Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      error.message || "Failed to check follow status"
    );
  }
};

/**
 * Get news alerts for all followed companies
 * GET /api/companies/news/alerts
 * 
 * Returns companies with new news since the user last checked
 */
export const getNewsAlerts = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      sendErrorResponse(res, 401, "UNAUTHORIZED", "Authentication required");
      return;
    }

    // Get all companies the user is following
    const followedCompanies = await (prisma as any).companyFollows.findMany({
      where: { userId },
      include: {
        company: {
          include: {
            company_news: {
              orderBy: { publish_date: "desc" },
              take: 10, // Get recent news
            },
          },
        },
      },
    });

    // For each followed company, check for new news
    // We'll consider news "new" if it was published after the user started following
    const alerts = await Promise.all(
      followedCompanies.map(async (follow: any) => {
        const followDate = follow.createdAt || new Date(0);
        
        // Get news published after the follow date
        const newNews = follow.company.company_news.filter(
          (news: any) => new Date(news.publish_date) > followDate
        );

        // Also check for news published in the last 7 days (even if before follow date)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentNews = follow.company.company_news.filter(
          (news: any) => new Date(news.publish_date) > sevenDaysAgo
        );

        return {
          companyId: follow.company.id,
          companyName: follow.company.name,
          newNewsCount: newNews.length,
          recentNewsCount: recentNews.length,
          latestNews: recentNews.slice(0, 3).map((news: any) => ({
            headline: news.headline,
            publishDate: news.publish_date,
            category: news.category,
            url: news.url,
          })),
          followedSince: follow.createdAt,
        };
      })
    );

    // Filter to only companies with new/recent news
    const companiesWithNews = alerts.filter(
      (alert: any) => alert.newNewsCount > 0 || alert.recentNewsCount > 0
    );

    res.status(200).json({
      success: true,
      data: {
        totalAlerts: companiesWithNews.reduce(
          (sum: number, alert: any) => sum + alert.newNewsCount,
          0
        ),
        companies: companiesWithNews,
      },
    });
  } catch (error: any) {
    console.error("[Get News Alerts Error]", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      error.message || "Failed to get news alerts"
    );
  }
};

/**
 * Export company research as PDF
 * GET /companies/:companyId/research/export
 */
/**
 * Export company research as PDF
 * GET /companies/:companyId/research/export
 */
export const exportCompanyResearch = async (
  req: Request<{ companyId: string }, {}, {}, {}>,
  res: Response
): Promise<void> => {
  console.log("Test")
  try {
    console.log("[Export Company Research] Starting export");
    console.log("[Export Company Research] Params:", req.params);
    console.log("[Export Company Research] User:", (req as any).user);
    console.log("[Export Company Research] Headers:", req.headers);
    const { companyId } = req.params;
    const userId = (req as any).user?.uid;

    if (!companyId) {
      sendErrorResponse(res, 400, "INVALID_INPUT", "Company ID is required");
      return;
    }

    // Fetch company research from database
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Company research not found");
      return;
    }

    // Verify user has access by checking if they have a job associated with this company
    const job = await prisma.jobOpportunity.findFirst({
      where: {
        userId: userId,
        company: company.name,
      },
    });

    if (!job) {
      sendErrorResponse(
        res, 
        403, 
        "FORBIDDEN", 
        "You don't have access to this company's research. You must have a job opportunity associated with this company."
      );
      return;
    }

    // Generate PDF
    const pdfBuffer = await generateCompanyResearchPDF(company);

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${sanitizeFilename(company.name)}-research.pdf"`
    );

    res.send(pdfBuffer);
  } catch (error) {
    console.error("[Export Company Research] Error:", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      error instanceof Error
        ? error.message
        : "Failed to export company research"
    );
  }
};

/**
 * Helper function to generate company research PDF (async version)
 */
async function generateCompanyResearchPDF(companyData: any): Promise<Buffer> {
  const PDFDocument = require("pdfkit");

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Title
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text(companyData.name || "Company Research", {
        align: "center",
      });

    doc.moveDown();
    doc
      .fontSize(12)
      .font("Helvetica")
      .text(`Generated: ${new Date().toLocaleDateString()}`, {
        align: "center",
      });

    doc.moveDown(2);

    // Basic Information Section
    doc.fontSize(16).font("Helvetica-Bold").text("Company Overview");
    doc.moveDown(0.5);

    if (companyData.size) {
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("Company Size: ", { continued: true })
        .font("Helvetica")
        .text(`${companyData.size} employees`);
    }

    if (companyData.industry) {
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("Industry: ", { continued: true })
        .font("Helvetica")
        .text(companyData.industry);
    }

    if (companyData.location) {
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("Headquarters: ", { continued: true })
        .font("Helvetica")
        .text(companyData.location);
    }

    if (companyData.website) {
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("Website: ", { continued: true })
        .font("Helvetica")
        .fillColor("blue")
        .text(companyData.website, { link: companyData.website })
        .fillColor("black");
    }

    if (companyData.glassdoorRating) {
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("Glassdoor Rating: ", { continued: true })
        .font("Helvetica")
        .text(`${Number(companyData.glassdoorRating).toFixed(1)} / 5.0`);
    }

    doc.moveDown(1.5);

    // Description
    if (companyData.description) {
      doc.fontSize(16).font("Helvetica-Bold").text("About");
      doc.moveDown(0.5);
      doc
        .fontSize(11)
        .font("Helvetica")
        .text(companyData.description, { align: "justify" });
      doc.moveDown(1.5);
    }

    // Mission
    if (companyData.mission) {
      doc.fontSize(16).font("Helvetica-Bold").text("Mission & Values");
      doc.moveDown(0.5);
      doc
        .fontSize(11)
        .font("Helvetica-Oblique")
        .text(companyData.mission, { align: "justify" });
      doc.moveDown(1.5);
    }

    // Products & Services - from Json field
    const productsAndServices = companyData.products_and_services;
    if (productsAndServices && Array.isArray(productsAndServices) && productsAndServices.length > 0) {
      doc.fontSize(16).font("Helvetica-Bold").text("Products & Services");
      doc.moveDown(0.5);
      productsAndServices.forEach((product: string) => {
        doc.fontSize(11).font("Helvetica").text(`• ${product}`);
      });
      doc.moveDown(1.5);
    }

    // Leadership - from Json field
    const leadership = companyData.leadership;
    if (leadership && Array.isArray(leadership) && leadership.length > 0) {
      doc.fontSize(16).font("Helvetica-Bold").text("Leadership Team");
      doc.moveDown(0.5);
      leadership.forEach((leader: any) => {
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .text(leader.name, { continued: true })
          .font("Helvetica")
          .text(` - ${leader.title}`);
      });
      doc.moveDown(1.5);
    }

    // Market Position
    if (companyData.competitive_landscape) {
      doc.fontSize(16).font("Helvetica-Bold").text("Market Position");
      doc.moveDown(0.5);
      doc
        .fontSize(11)
        .font("Helvetica")
        .text(companyData.competitive_landscape, { align: "justify" });
      doc.moveDown(1.5);
    }

    // Contact Information - from Json field
    const contactInfo = companyData.contactInfo;
    if (contactInfo) {
      const hasContact = contactInfo.email || contactInfo.phone || contactInfo.address;
      
      if (hasContact) {
        doc.fontSize(16).font("Helvetica-Bold").text("Contact Information");
        doc.moveDown(0.5);

        if (contactInfo.email) {
          doc
            .fontSize(11)
            .font("Helvetica-Bold")
            .text("Email: ", { continued: true })
            .font("Helvetica")
            .fillColor("blue")
            .text(contactInfo.email, {
              link: `mailto:${contactInfo.email}`,
            })
            .fillColor("black");
        }

        if (contactInfo.phone) {
          doc
            .fontSize(11)
            .font("Helvetica-Bold")
            .text("Phone: ", { continued: true })
            .font("Helvetica")
            .text(contactInfo.phone);
        }

        if (contactInfo.address) {
          doc
            .fontSize(11)
            .font("Helvetica-Bold")
            .text("Address: ", { continued: true })
            .font("Helvetica")
            .text(contactInfo.address);
        }

        doc.moveDown(1.5);
      }
    }

    // Social Media - from Json field (if it exists in contactInfo)
    if (contactInfo && (contactInfo.linkedin || contactInfo.twitter)) {
      doc.fontSize(16).font("Helvetica-Bold").text("Social Media");
      doc.moveDown(0.5);

      if (contactInfo.linkedin) {
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .text("LinkedIn: ", { continued: true })
          .font("Helvetica")
          .fillColor("blue")
          .text(contactInfo.linkedin, {
            link: contactInfo.linkedin,
          })
          .fillColor("black");
      }

      if (contactInfo.twitter) {
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .text("Twitter: ", { continued: true })
          .font("Helvetica")
          .fillColor("blue")
          .text(contactInfo.twitter, {
            link: contactInfo.twitter,
          })
          .fillColor("black");
      }
    }

    // Footer
    doc.moveDown(2);
    doc
      .fontSize(10)
      .font("Helvetica-Oblique")
      .fillColor("gray")
      .text("Generated by JobBuddy - Your AI Job Application Assistant", {
        align: "center",
      });

    doc.end();
  });
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-z0-9]/gi, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}