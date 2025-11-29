import { Response } from 'express';
import { prisma } from '../db';
import { Prisma } from '@prisma/client';
import {
    validateNetworkingEvent,
    validateNetworkingEventUpdate,
    validateNetworkingEventConnection,
} from '../validators/networkingEvent.validator';
import { sendErrorResponse } from '../utils/errorResponse';
import { AuthRequest } from '../middleware/auth.middleware';
import { normalizeDate } from '../utils/formatters';

export const createNetworkingEvent = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.userId!;
        const body = { ...req.body, userId };

        const validationErrors = validateNetworkingEvent(body);
        if (validationErrors.length > 0) {
            sendErrorResponse(
                res,
                400,
                'VALIDATION_ERROR',
                'Invalid input data',
                validationErrors.map((error) => ({ field: '', message: error }))
            );
            return;
        }

        const eventData: any = {
            userId,
            eventName: body.eventName,
            eventType: body.eventType,
            status: body.status || 'planned',
            eventDate: new Date(body.eventDate),
        };

        if (body.endDate) eventData.endDate = new Date(body.endDate);
        if (body.location !== undefined) eventData.location = body.location;
        if (body.locationCity !== undefined) eventData.locationCity = body.locationCity;
        if (body.locationState !== undefined) eventData.locationState = body.locationState;
        if (body.locationCountry !== undefined) eventData.locationCountry = body.locationCountry;
        if (body.isVirtual !== undefined) eventData.isVirtual = body.isVirtual;
        if (body.eventUrl !== undefined) eventData.eventUrl = body.eventUrl;
        if (body.organizer !== undefined) eventData.organizer = body.organizer;
        if (body.description !== undefined) eventData.description = body.description;
        if (body.industry !== undefined) eventData.industry = body.industry;
        if (body.preEventGoals) eventData.preEventGoals = body.preEventGoals;
        if (body.targetCompanies) eventData.targetCompanies = body.targetCompanies;
        if (body.targetRoles) eventData.targetRoles = body.targetRoles;
        if (body.preparationNotes !== undefined) eventData.preparationNotes = body.preparationNotes;
        if (body.attended !== undefined) eventData.attended = body.attended;
        if (body.attendanceDate) eventData.attendanceDate = new Date(body.attendanceDate);
        if (body.connectionsMade !== undefined) eventData.connectionsMade = body.connectionsMade;
        if (body.postEventNotes !== undefined) eventData.postEventNotes = body.postEventNotes;
        if (body.followUpActions) eventData.followUpActions = body.followUpActions;
        if (body.followUpCompleted !== undefined) eventData.followUpCompleted = body.followUpCompleted;
        if (body.roiNotes !== undefined) eventData.roiNotes = body.roiNotes;
        if (body.linkedJobIds) eventData.linkedJobIds = body.linkedJobIds;

        const networkingEvent = await prisma.networkingEvent.create({
            data: eventData,
            include: {
                eventConnections: {
                    include: {
                        contact: true,
                    },
                },
            },
        });

        res.status(201).json(networkingEvent);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2003') {
                sendErrorResponse(res, 404, 'NOT_FOUND', 'Related record not found');
                return;
            }
        }
        console.error('[Create Networking Event Error]', error);
        sendErrorResponse(
            res,
            500,
            'INTERNAL_ERROR',
            'Failed to create networking event'
        );
    }
};

export const getNetworkingEvent = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;

        const networkingEvent = await prisma.networkingEvent.findFirst({
            where: {
                id,
                userId,
            },
            include: {
                eventConnections: {
                    include: {
                        contact: true,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        });

        if (!networkingEvent) {
            sendErrorResponse(res, 404, 'NOT_FOUND', 'Networking event not found');
            return;
        }

        res.status(200).json(networkingEvent);
    } catch (error) {
        console.error('[Get Networking Event Error]', error);
        sendErrorResponse(
            res,
            500,
            'INTERNAL_ERROR',
            'Failed to fetch networking event'
        );
    }
};

export const listNetworkingEvents = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.userId!;
        const { status, eventType, industry, upcoming } = req.query;

        const where: Prisma.NetworkingEventWhereInput = {
            userId,
        };

        if (status && typeof status === 'string') {
            where.status = status as any;
        }

        if (eventType && typeof eventType === 'string') {
            where.eventType = eventType as any;
        }

        if (industry && typeof industry === 'string') {
            where.industry = industry;
        }

        if (upcoming === 'true') {
            where.eventDate = {
                gte: new Date(),
            };
        }

        const events = await prisma.networkingEvent.findMany({
            where,
            include: {
                eventConnections: {
                    include: {
                        contact: true,
                    },
                },
            },
            orderBy: {
                eventDate: 'desc',
            },
        });

        res.status(200).json(events);
    } catch (error) {
        console.error('[List Networking Events Error]', error);
        sendErrorResponse(
            res,
            500,
            'INTERNAL_ERROR',
            'Failed to fetch networking events'
        );
    }
};

export const updateNetworkingEvent = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;
        const body = { ...req.body };

        const validationErrors = validateNetworkingEventUpdate(body);
        if (validationErrors.length > 0) {
            sendErrorResponse(
                res,
                400,
                'VALIDATION_ERROR',
                'Invalid input data',
                validationErrors.map((error) => ({ field: '', message: error }))
            );
            return;
        }

        const existing = await prisma.networkingEvent.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            sendErrorResponse(res, 404, 'NOT_FOUND', 'Networking event not found');
            return;
        }

        const updateData: any = {};

        if (body.eventName !== undefined) updateData.eventName = body.eventName;
        if (body.eventType !== undefined) updateData.eventType = body.eventType;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.eventDate !== undefined) updateData.eventDate = new Date(body.eventDate);
        if (body.endDate !== undefined) {
            updateData.endDate = body.endDate ? new Date(body.endDate) : null;
        }
        if (body.location !== undefined) updateData.location = body.location;
        if (body.locationCity !== undefined) updateData.locationCity = body.locationCity;
        if (body.locationState !== undefined) updateData.locationState = body.locationState;
        if (body.locationCountry !== undefined) updateData.locationCountry = body.locationCountry;
        if (body.isVirtual !== undefined) updateData.isVirtual = body.isVirtual;
        if (body.eventUrl !== undefined) updateData.eventUrl = body.eventUrl;
        if (body.organizer !== undefined) updateData.organizer = body.organizer;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.industry !== undefined) updateData.industry = body.industry;
        if (body.preEventGoals !== undefined) updateData.preEventGoals = body.preEventGoals;
        if (body.targetCompanies !== undefined) updateData.targetCompanies = body.targetCompanies;
        if (body.targetRoles !== undefined) updateData.targetRoles = body.targetRoles;
        if (body.preparationNotes !== undefined) updateData.preparationNotes = body.preparationNotes;
        if (body.attended !== undefined) updateData.attended = body.attended;
        if (body.attendanceDate !== undefined) {
            updateData.attendanceDate = body.attendanceDate ? new Date(body.attendanceDate) : null;
        }
        if (body.connectionsMade !== undefined) updateData.connectionsMade = body.connectionsMade;
        if (body.postEventNotes !== undefined) updateData.postEventNotes = body.postEventNotes;
        if (body.followUpActions !== undefined) updateData.followUpActions = body.followUpActions;
        if (body.followUpCompleted !== undefined) updateData.followUpCompleted = body.followUpCompleted;
        if (body.roiNotes !== undefined) updateData.roiNotes = body.roiNotes;
        if (body.linkedJobIds !== undefined) updateData.linkedJobIds = body.linkedJobIds;

        const updated = await prisma.networkingEvent.update({
            where: { id },
            data: updateData,
            include: {
                eventConnections: {
                    include: {
                        contact: true,
                    },
                },
            },
        });

        res.status(200).json(updated);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                sendErrorResponse(res, 404, 'NOT_FOUND', 'Networking event not found');
                return;
            }
        }
        console.error('[Update Networking Event Error]', error);
        sendErrorResponse(
            res,
            500,
            'INTERNAL_ERROR',
            'Failed to update networking event'
        );
    }
};

export const deleteNetworkingEvent = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;

        const existing = await prisma.networkingEvent.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            sendErrorResponse(res, 404, 'NOT_FOUND', 'Networking event not found');
            return;
        }

        await prisma.networkingEvent.delete({
            where: { id },
        });

        res.status(200).json({ message: 'Networking event deleted successfully' });
    } catch (error) {
        console.error('[Delete Networking Event Error]', error);
        sendErrorResponse(
            res,
            500,
            'INTERNAL_ERROR',
            'Failed to delete networking event'
        );
    }
};

export const addEventConnection = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.userId!;
        const body = { ...req.body };

        const validationErrors = validateNetworkingEventConnection(body);
        if (validationErrors.length > 0) {
            sendErrorResponse(
                res,
                400,
                'VALIDATION_ERROR',
                'Invalid input data',
                validationErrors.map((error) => ({ field: '', message: error }))
            );
            return;
        }

        // Verify event belongs to user
        const event = await prisma.networkingEvent.findFirst({
            where: { id: body.eventId, userId },
        });

        if (!event) {
            sendErrorResponse(res, 404, 'NOT_FOUND', 'Networking event not found');
            return;
        }

        // If contactId is provided, verify it belongs to user
        if (body.contactId) {
            const contact = await prisma.professionalContact.findFirst({
                where: { id: body.contactId, userId },
            });

            if (!contact) {
                sendErrorResponse(res, 404, 'NOT_FOUND', 'Contact not found');
                return;
            }
        }

        const connectionData: any = {
            eventId: body.eventId,
        };

        if (body.contactId) connectionData.contactId = body.contactId;
        if (body.contactName !== undefined) connectionData.contactName = body.contactName;
        if (body.contactEmail !== undefined) connectionData.contactEmail = body.contactEmail;
        if (body.contactCompany !== undefined) connectionData.contactCompany = body.contactCompany;
        if (body.contactRole !== undefined) connectionData.contactRole = body.contactRole;
        if (body.notes !== undefined) connectionData.notes = body.notes;
        if (body.followUpDate) connectionData.followUpDate = new Date(body.followUpDate);
        if (body.followUpCompleted !== undefined) connectionData.followUpCompleted = body.followUpCompleted;

        const connection = await prisma.networkingEventConnection.create({
            data: connectionData,
            include: {
                contact: true,
                event: true,
            },
        });

        // Update event connections count
        await prisma.networkingEvent.update({
            where: { id: body.eventId },
            data: {
                connectionsMade: {
                    increment: 1,
                },
            },
        });

        res.status(201).json(connection);
    } catch (error) {
        console.error('[Add Event Connection Error]', error);
        sendErrorResponse(
            res,
            500,
            'INTERNAL_ERROR',
            'Failed to add event connection'
        );
    }
};

export const updateEventConnection = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { connectionId } = req.params;
        const userId = req.userId!;
        const body = { ...req.body };

        // Verify connection belongs to user's event
        const existing = await prisma.networkingEventConnection.findFirst({
            where: {
                id: connectionId,
                event: {
                    userId,
                },
            },
        });

        if (!existing) {
            sendErrorResponse(res, 404, 'NOT_FOUND', 'Event connection not found');
            return;
        }

        const updateData: any = {};

        if (body.contactId !== undefined) {
            if (body.contactId) {
                const contact = await prisma.professionalContact.findFirst({
                    where: { id: body.contactId, userId },
                });
                if (!contact) {
                    sendErrorResponse(res, 404, 'NOT_FOUND', 'Contact not found');
                    return;
                }
            }
            updateData.contactId = body.contactId;
        }
        if (body.contactName !== undefined) updateData.contactName = body.contactName;
        if (body.contactEmail !== undefined) updateData.contactEmail = body.contactEmail;
        if (body.contactCompany !== undefined) updateData.contactCompany = body.contactCompany;
        if (body.contactRole !== undefined) updateData.contactRole = body.contactRole;
        if (body.notes !== undefined) updateData.notes = body.notes;
        if (body.followUpDate !== undefined) {
            updateData.followUpDate = body.followUpDate ? new Date(body.followUpDate) : null;
        }
        if (body.followUpCompleted !== undefined) updateData.followUpCompleted = body.followUpCompleted;

        const updated = await prisma.networkingEventConnection.update({
            where: { id: connectionId },
            data: updateData,
            include: {
                contact: true,
                event: true,
            },
        });

        res.status(200).json(updated);
    } catch (error) {
        console.error('[Update Event Connection Error]', error);
        sendErrorResponse(
            res,
            500,
            'INTERNAL_ERROR',
            'Failed to update event connection'
        );
    }
};

export const deleteEventConnection = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { connectionId } = req.params;
        const userId = req.userId!;

        const existing = await prisma.networkingEventConnection.findFirst({
            where: {
                id: connectionId,
                event: {
                    userId,
                },
            },
        });

        if (!existing) {
            sendErrorResponse(res, 404, 'NOT_FOUND', 'Event connection not found');
            return;
        }

        await prisma.networkingEventConnection.delete({
            where: { id: connectionId },
        });

        // Update event connections count
        await prisma.networkingEvent.update({
            where: { id: existing.eventId },
            data: {
                connectionsMade: {
                    decrement: 1,
                },
            },
        });

        res.status(200).json({ message: 'Event connection deleted successfully' });
    } catch (error) {
        console.error('[Delete Event Connection Error]', error);
        sendErrorResponse(
            res,
            500,
            'INTERNAL_ERROR',
            'Failed to delete event connection'
        );
    }
};


