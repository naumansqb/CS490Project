// controllers/company.controller.ts
import { Response } from "express";
import { prisma } from "../db";
import { Prisma } from "@prisma/client";
import {
  validateCompany,
  validateCompanyUpdate,
} from "../validators/company.validator";
import { sendErrorResponse } from "../utils/errorResponse";
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
