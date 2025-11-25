import { Response } from 'express';
import { prisma } from '../db';
import { Prisma } from '@prisma/client';
import {
    validateProfessionalContact,
    validateProfessionalContactUpdate,
    validateContactInteraction,
} from '../validators/professionalContact.validator';
import { sendErrorResponse } from '../utils/errorResponse';
import { AuthRequest } from '../middleware/auth.middleware';
import { normalizeUrl, normalizeDate, normalizeRelationshipStrength } from '../utils/formatters';

export const createProfessionalContact = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.userId!;

        const body = { ...req.body };
        if (body.linkedinUrl) body.linkedinUrl = normalizeUrl(body.linkedinUrl);
        if (body.websiteUrl) body.websiteUrl = normalizeUrl(body.websiteUrl);
        if (body.profilePhotoUrl) body.profilePhotoUrl = normalizeUrl(body.profilePhotoUrl);

        if (body.lastContactDate !== undefined && body.lastContactDate !== null && body.lastContactDate !== '') {
            const normalized = normalizeDate(body.lastContactDate);
            if (normalized) {
                body.lastContactDate = normalized;
            } else {
                delete body.lastContactDate;
            }
        } else if (body.lastContactDate === '' || body.lastContactDate === null) {
            body.lastContactDate = null;
        }

        if (body.nextFollowUpDate !== undefined && body.nextFollowUpDate !== null && body.nextFollowUpDate !== '') {
            const normalized = normalizeDate(body.nextFollowUpDate);
            if (normalized) {
                body.nextFollowUpDate = normalized;
            } else {
                delete body.nextFollowUpDate;
            }
        } else if (body.nextFollowUpDate === '' || body.nextFollowUpDate === null) {
            body.nextFollowUpDate = null;
        }

        if ('relationshipStrength' in body) {
            body.relationshipStrength = normalizeRelationshipStrength(body.relationshipStrength);
        }

        // If undefined, let database default handle it
        const validationErrors = validateProfessionalContact({ ...body, userId });
        if (validationErrors.length > 0) {
            sendErrorResponse(
                res,
                400,
                'VALIDATION_ERROR',
                'Invalid input data',
                validationErrors
            );
            return;
        }

        const contact = await prisma.professionalContact.create({
            data: { ...body, userId },
        });

        res.status(201).json(contact);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2003') {
                sendErrorResponse(res, 404, 'NOT_FOUND', 'User profile not found');
                return;
            }
        }
        sendErrorResponse(
            res,
            500,
            'INTERNAL_ERROR',
            'Failed to create professional contact'
        );
    }
};

export const getProfessionalContact = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;

        const contact = await prisma.professionalContact.findFirst({
            where: {
                id,
                userId,
            },
            include: {
                interactions: {
                    orderBy: {
                        interactionDate: 'desc',
                    },
                },
                companyRef: true,
            },
        });

        if (!contact) {
            sendErrorResponse(res, 404, 'NOT_FOUND', 'Professional contact not found');
            return;
        }

        res.json(contact);
    } catch (error) {
        sendErrorResponse(
            res,
            500,
            'INTERNAL_ERROR',
            'Failed to fetch professional contact'
        );
    }
};

export const listProfessionalContacts = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.userId!;
        const {
            search,
            industry,
            relationshipType,
            company,
            category,
            page = '1',
            limit = '20',
        } = req.query;

        const where: Prisma.ProfessionalContactWhereInput = {
            userId,
        };

        if (search) {
            where.OR = [
                { fullName: { contains: search as string, mode: 'insensitive' } },
                { email: { contains: search as string, mode: 'insensitive' } },
                { company: { contains: search as string, mode: 'insensitive' } },
                { jobTitle: { contains: search as string, mode: 'insensitive' } },
            ];
        }

        if (industry) {
            where.industry = industry as string;
        }

        if (relationshipType) {
            where.relationshipType = relationshipType as string;
        }

        if (company) {
            where.company = { contains: company as string, mode: 'insensitive' };
        }

        if (category) {
            where.category = category as string;
        }

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const [contacts, total] = await Promise.all([
            prisma.professionalContact.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: {
                    updatedAt: 'desc',
                },
                include: {
                    interactions: {
                        orderBy: {
                            interactionDate: 'desc',
                        },
                        take: 1,
                    },
                },
            }),
            prisma.professionalContact.count({ where }),
        ]);

        res.json({
            contacts,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        sendErrorResponse(
            res,
            500,
            'INTERNAL_ERROR',
            'Failed to fetch professional contacts'
        );
    }
};

export const updateProfessionalContact = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;

        const body = { ...req.body };
        if (body.linkedinUrl !== undefined) body.linkedinUrl = normalizeUrl(body.linkedinUrl);
        if (body.websiteUrl !== undefined) body.websiteUrl = normalizeUrl(body.websiteUrl);
        if (body.profilePhotoUrl !== undefined) body.profilePhotoUrl = normalizeUrl(body.profilePhotoUrl);

        if (body.lastContactDate !== undefined && body.lastContactDate !== null && body.lastContactDate !== '') {
            const normalized = normalizeDate(body.lastContactDate);
            if (normalized) {
                body.lastContactDate = normalized;
            } else {
                delete body.lastContactDate;
            }
        } else if (body.lastContactDate === '' || body.lastContactDate === null) {
            body.lastContactDate = null;
        }

        if (body.nextFollowUpDate !== undefined && body.nextFollowUpDate !== null && body.nextFollowUpDate !== '') {
            const normalized = normalizeDate(body.nextFollowUpDate);
            if (normalized) {
                body.nextFollowUpDate = normalized;
            } else {
                delete body.nextFollowUpDate;
            }
        } else if (body.nextFollowUpDate === '' || body.nextFollowUpDate === null) {
            body.nextFollowUpDate = null;
        }

        const validationErrors = validateProfessionalContactUpdate(body);
        if (validationErrors.length > 0) {
            sendErrorResponse(
                res,
                400,
                'VALIDATION_ERROR',
                'Invalid input data',
                validationErrors
            );
            return;
        }

        const existingContact = await prisma.professionalContact.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!existingContact) {
            sendErrorResponse(res, 404, 'NOT_FOUND', 'Professional contact not found');
            return;
        }

        const updateData: any = { ...body };

        if (updateData.linkedJobIds !== undefined) {
            updateData.linkedJobIds = Array.isArray(updateData.linkedJobIds) ? updateData.linkedJobIds : [];
        }

        if ('relationshipStrength' in body) {
            if (body.relationshipStrength === null || body.relationshipStrength === undefined || body.relationshipStrength === '') {
                updateData.relationshipStrength = null;
            } else {
                updateData.relationshipStrength = normalizeRelationshipStrength(body.relationshipStrength);
            }
        }

        const contact = await prisma.professionalContact.update({
            where: { id },
            data: updateData,
        });

        res.json(contact);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                sendErrorResponse(res, 404, 'NOT_FOUND', 'Professional contact not found');
                return;
            }
        }
        sendErrorResponse(
            res,
            500,
            'INTERNAL_ERROR',
            'Failed to update professional contact'
        );
    }
};

export const deleteProfessionalContact = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;

        const existingContact = await prisma.professionalContact.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!existingContact) {
            sendErrorResponse(res, 404, 'NOT_FOUND', 'Professional contact not found');
            return;
        }

        await prisma.professionalContact.delete({
            where: { id },
        });

        res.status(204).send();
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                sendErrorResponse(res, 404, 'NOT_FOUND', 'Professional contact not found');
                return;
            }
        }
        sendErrorResponse(
            res,
            500,
            'INTERNAL_ERROR',
            'Failed to delete professional contact'
        );
    }
};

export const getFollowUpReminders = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.userId!;
        const { days = '7' } = req.query;

        const daysNum = parseInt(days as string);
        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() + daysNum);

        const contacts = await prisma.professionalContact.findMany({
            where: {
                userId,
                nextFollowUpDate: {
                    not: null,
                    lte: dateThreshold,
                },
            },
            orderBy: {
                nextFollowUpDate: 'asc',
            },
            take: 50,
        });

        res.json(contacts);
    } catch (error) {
        sendErrorResponse(
            res,
            500,
            'INTERNAL_ERROR',
            'Failed to fetch follow-up reminders'
        );
    }
};

export const createContactInteraction = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.userId!;
        const { contactId } = req.params;

        const contact = await prisma.professionalContact.findFirst({
            where: {
                id: contactId,
                userId,
            },
        });

        if (!contact) {
            sendErrorResponse(res, 404, 'NOT_FOUND', 'Professional contact not found');
            return;
        }

        const validationErrors = validateContactInteraction({
            ...req.body,
            contactId,
        });
        if (validationErrors.length > 0) {
            sendErrorResponse(
                res,
                400,
                'VALIDATION_ERROR',
                'Invalid input data',
                validationErrors
            );
            return;
        }

        const interaction = await prisma.contactInteraction.create({
            data: {
                contactId,
                ...req.body,
            },
        });

        // Update contact's last contact date and relationship strength
        const updateData: any = {};

        if (req.body.interactionDate) {
            updateData.lastContactDate = new Date(req.body.interactionDate);
        }

        if (req.body.relationshipChange !== undefined && req.body.relationshipChange !== null) {
            // FIX: Use explicit null check, allowing 0 values
            const currentStrength = (contact.relationshipStrength !== null && contact.relationshipStrength !== undefined)
                ? contact.relationshipStrength
                : 50;

            const change = parseInt(req.body.relationshipChange.toString());
            let newStrength = currentStrength + change;

            // Clamp to 0-100 range (prevents negative values)
            newStrength = Math.max(0, Math.min(100, newStrength));

            updateData.relationshipStrength = newStrength;
        }

        if (Object.keys(updateData).length > 0) {
            await prisma.professionalContact.update({
                where: { id: contactId },
                data: updateData,
            });
        }

        res.status(201).json(interaction);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2003') {
                sendErrorResponse(res, 404, 'NOT_FOUND', 'Contact not found');
                return;
            }
        }
        sendErrorResponse(
            res,
            500,
            'INTERNAL_ERROR',
            'Failed to create contact interaction'
        );
    }
};

export const updateContactInteraction = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.userId!;
        const { contactId, interactionId } = req.params;

        const contact = await prisma.professionalContact.findFirst({
            where: {
                id: contactId,
                userId,
            },
        });

        if (!contact) {
            sendErrorResponse(res, 404, 'NOT_FOUND', 'Professional contact not found');
            return;
        }

        const existingInteraction = await prisma.contactInteraction.findFirst({
            where: {
                id: interactionId,
                contactId,
            },
        });

        if (!existingInteraction) {
            sendErrorResponse(res, 404, 'NOT_FOUND', 'Interaction not found');
            return;
        }

        const validationErrors = validateContactInteraction({
            ...req.body,
            contactId,
        });
        if (validationErrors.length > 0) {
            sendErrorResponse(
                res,
                400,
                'VALIDATION_ERROR',
                'Invalid input data',
                validationErrors
            );
            return;
        }

        // FIX: Use explicit null checks to preserve 0 values
        const oldChange = (existingInteraction.relationshipChange !== null && existingInteraction.relationshipChange !== undefined)
            ? existingInteraction.relationshipChange
            : 0;

        const newChange = (req.body.relationshipChange !== null && req.body.relationshipChange !== undefined)
            ? parseInt(req.body.relationshipChange.toString())
            : 0;

        const interaction = await prisma.contactInteraction.update({
            where: { id: interactionId },
            data: req.body,
        });

        // FIX: Calculate new strength properly, allowing 0 values
        const currentStrength = (contact.relationshipStrength !== null && contact.relationshipStrength !== undefined)
            ? contact.relationshipStrength
            : 50;

        // Remove old change, add new change
        let newStrength = currentStrength - oldChange + newChange;
        newStrength = Math.max(0, Math.min(100, newStrength));

        await prisma.professionalContact.update({
            where: { id: contactId },
            data: {
                relationshipStrength: newStrength,
                lastContactDate: req.body.interactionDate ? new Date(req.body.interactionDate) : contact.lastContactDate,
            },
        });

        res.json(interaction);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                sendErrorResponse(res, 404, 'NOT_FOUND', 'Interaction not found');
                return;
            }
        }
        sendErrorResponse(
            res,
            500,
            'INTERNAL_ERROR',
            'Failed to update contact interaction'
        );
    }
};

export const deleteContactInteraction = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { id, interactionId } = req.params;
        const userId = req.userId!;

        const contact = await prisma.professionalContact.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!contact) {
            sendErrorResponse(res, 404, 'NOT_FOUND', 'Professional contact not found');
            return;
        }

        const interactionToDelete = await prisma.contactInteraction.findFirst({
            where: {
                id: interactionId,
                contactId: id,
            },
        });

        if (!interactionToDelete) {
            sendErrorResponse(res, 404, 'NOT_FOUND', 'Contact interaction not found');
            return;
        }

        await prisma.contactInteraction.delete({
            where: { id: interactionId },
        });

        const currentStrength = (contact.relationshipStrength !== null && contact.relationshipStrength !== undefined)
            ? contact.relationshipStrength
            : 50;

        const deletedChange = (interactionToDelete.relationshipChange !== null && interactionToDelete.relationshipChange !== undefined)
            ? interactionToDelete.relationshipChange
            : 0;

        let newStrength = currentStrength - deletedChange;
        newStrength = Math.max(0, Math.min(100, newStrength));

        await prisma.professionalContact.update({
            where: { id },
            data: { relationshipStrength: newStrength },
        });

        res.status(204).send();
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                sendErrorResponse(res, 404, 'NOT_FOUND', 'Interaction not found');
                return;
            }
        }
        sendErrorResponse(
            res,
            500,
            'INTERNAL_ERROR',
            'Failed to delete contact interaction'
        );
    }
};


