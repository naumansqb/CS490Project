import { Request, Response } from "express";
import { prisma } from "../db";
import { sendErrorResponse } from "../utils/errorResponse";

/**
 * Helper: map template.type -> preview image URL
 * NOTE: Your images are in /public at the root of your Next.js app,
 * so their browser paths are just "/chronological.jpg", etc.
 */

//server/src/controllers/resumeTemplate.controller.ts

function getPreviewUrlForType(templateType: string | null | undefined): string {
    const lower = (templateType || "").toLowerCase();

    if (lower.includes("chrono")) {
        return "/chronological.jpg";
    }
    if (lower.includes("function")) {
        return "/functional.jpg";
    }
    if (lower.includes("hybrid")) {
        return "/hybrid.jpg";
    }

    // fallback so nothing shows as blank
    return "/chronological.jpg";
}

/**
 * GET /api/resume-templates
 * Returns the list of active templates with preview URLs
 */
export const getAllTemplates = async (
    _req: Request,
    res: Response
): Promise<void> => {
    try {
        const templates = await prisma.resumeTemplate.findMany({
            where: { isActive: true },
            orderBy: [{ isDefault: "desc" }, { name: "asc" }],
            select: {
                id: true,
                name: true,
                description: true,
                type: true,
                isDefault: true,
            },
        });

        const withPreview = templates.map((t) => ({
            ...t,
            preview: getPreviewUrlForType(t.type),
        }));

        res.json(withPreview);
    } catch (error) {
        console.error("Error fetching resume templates:", error);
        sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to fetch templates");
    }
};

/**
 * GET /api/resume-templates/:id
 * Get one template with full details + preview URL
 */
export const getTemplateById = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        const template = await prisma.resumeTemplate.findUnique({
            where: { id },
        });

        if (!template) {
            sendErrorResponse(res, 404, "NOT_FOUND", "Template not found");
            return;
        }

        const fullTemplate = {
            ...template,
            preview: getPreviewUrlForType(template.type),
        };

        res.json(fullTemplate);
    } catch (error) {
        console.error("Error fetching resume template:", error);
        sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to fetch template");
    }
};
