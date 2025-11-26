import { Response } from 'express';
import { prisma } from '../db';
import { Prisma } from '@prisma/client';
import {
    validateReferralRequest,
    validateReferralRequestUpdate,
} from '../validators/referralRequest.validator';
import { sendErrorResponse } from '../utils/errorResponse';
import { AuthRequest } from '../middleware/auth.middleware';
import {
    generateReferralTemplate,
    generateFollowUpTemplate,
    generateGratitudeTemplate,
} from '../services/referralTemplate.service';

export const createReferralRequest = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.userId!;
        const body = { ...req.body, userId };

        const validationErrors = validateReferralRequest(body);
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

        // Verify job and contact belong to user
        const [job, contact] = await Promise.all([
            prisma.jobOpportunity.findFirst({
                where: { id: body.jobId, userId },
            }),
            prisma.professionalContact.findFirst({
                where: { id: body.contactId, userId },
            }),
        ]);

        if (!job) {
            sendErrorResponse(res, 404, 'NOT_FOUND', 'Job opportunity not found');
            return;
        }

        if (!contact) {
            sendErrorResponse(res, 404, 'NOT_FOUND', 'Contact not found');
            return;
        }

        const referralData: any = {
            userId,
            jobId: body.jobId,
            contactId: body.contactId,
            status: body.status || 'draft',
        };

        if (body.requestMessage) referralData.requestMessage = body.requestMessage;
        if (body.templateUsed) referralData.templateUsed = body.templateUsed;
        if (body.requestDate) referralData.requestDate = new Date(body.requestDate);
        if (body.sentDate) referralData.sentDate = new Date(body.sentDate);
        if (body.followUpDate) referralData.followUpDate = new Date(body.followUpDate);
        if (body.nextFollowUpDate) referralData.nextFollowUpDate = new Date(body.nextFollowUpDate);
        if (body.optimalTimingScore !== undefined && body.optimalTimingScore !== null) {
            referralData.optimalTimingScore = body.optimalTimingScore;
        }
        if (body.timingReason) referralData.timingReason = body.timingReason;

        const referralRequest = await prisma.referralRequest.create({
            data: referralData,
            include: {
                jobOpportunity: true,
                contact: true,
            },
        });

        res.status(201).json(referralRequest);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2003') {
                sendErrorResponse(res, 404, 'NOT_FOUND', 'Related record not found');
                return;
            }
        }
        console.error('[Create Referral Request Error]', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorDetails = error instanceof Prisma.PrismaClientKnownRequestError
            ? `Prisma Error ${error.code}: ${error.message}`
            : errorMessage;
        sendErrorResponse(
            res,
            500,
            'INTERNAL_ERROR',
            `Failed to create referral request: ${errorDetails}`
        );
    }
};

export const getReferralRequest = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;

        const referralRequest = await prisma.referralRequest.findFirst({
            where: {
                id,
                userId,
            },
            include: {
                jobOpportunity: true,
                contact: true,
            },
        });

        if (!referralRequest) {
            sendErrorResponse(res, 404, 'NOT_FOUND', 'Referral request not found');
            return;
        }

        res.status(200).json(referralRequest);
    } catch (error) {
        console.error('[Get Referral Request Error]', error);
        sendErrorResponse(
            res,
            500,
            'INTERNAL_ERROR',
            'Failed to fetch referral request'
        );
    }
};

export const listReferralRequests = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.userId!;
        const { jobId, contactId, status } = req.query;

        const where: Prisma.ReferralRequestWhereInput = {
            userId,
        };

        if (jobId) {
            where.jobId = jobId as string;
        }

        if (contactId) {
            where.contactId = contactId as string;
        }

        if (status) {
            where.status = status as any;
        }

        const referralRequests = await prisma.referralRequest.findMany({
            where,
            include: {
                jobOpportunity: true,
                contact: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.status(200).json(referralRequests);
    } catch (error) {
        console.error('[List Referral Requests Error]', error);
        sendErrorResponse(
            res,
            500,
            'INTERNAL_ERROR',
            'Failed to fetch referral requests'
        );
    }
};

export const updateReferralRequest = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;
        const body = { ...req.body };

        const validationErrors = validateReferralRequestUpdate(body);
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

        // Verify referral request belongs to user
        const existing = await prisma.referralRequest.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!existing) {
            sendErrorResponse(res, 404, 'NOT_FOUND', 'Referral request not found');
            return;
        }

        // Auto-update sentDate when status changes to 'sent'
        if (body.status === 'sent' && existing.status !== 'sent') {
            body.sentDate = new Date();
        }

        // Auto-update success and responseDate when status changes to accepted/declined
        if (body.status === 'accepted' && existing.status !== 'accepted') {
            body.success = true;
            body.responseDate = new Date();
        } else if (body.status === 'declined' && existing.status !== 'declined') {
            body.success = false;
            body.responseDate = new Date();
        } else if (body.status === 'completed' && existing.status !== 'completed') {
            body.success = true;
            if (!body.responseDate) {
                body.responseDate = new Date();
            }
        }

        // Auto-update relationship impact based on status if not provided
        if (body.status && body.relationshipImpact === undefined) {
            if (body.status === 'accepted' || body.status === 'completed') {
                body.relationshipImpact = 2; // Positive impact
            } else if (body.status === 'declined') {
                body.relationshipImpact = -1; // Slight negative impact
            }
        }

        const referralRequest = await prisma.referralRequest.update({
            where: { id },
            data: body,
            include: {
                jobOpportunity: true,
                contact: true,
            },
        });

        if (body.relationshipImpact !== undefined && body.relationshipImpact !== null) {
            const previousImpact = existing.relationshipImpact ?? 0;
            const newImpact = body.relationshipImpact;
            const deltaImpact = newImpact - previousImpact;

            if (deltaImpact !== 0) {
                try {
                    const contact = await prisma.professionalContact.findFirst({
                        where: {
                            id: existing.contactId,
                            userId,
                        },
                    });

                    if (contact) {
                        const currentStrength = contact.relationshipStrength ?? 50;
                        const newStrength = Math.max(
                            0,
                            Math.min(100, currentStrength + deltaImpact)
                        );

                        await prisma.professionalContact.update({
                            where: { id: contact.id },
                            data: {
                                relationshipStrength: newStrength,
                            },
                        });
                    }
                } catch (contactUpdateError) {
                    console.error(
                        '[Update Referral Request] Failed to sync relationshipStrength to contact',
                        contactUpdateError
                    );
                }
            }

        }

        res.status(200).json(referralRequest);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                sendErrorResponse(res, 404, 'NOT_FOUND', 'Referral request not found');
                return;
            }
        }
        console.error('[Update Referral Request Error]', error);
        sendErrorResponse(
            res,
            500,
            'INTERNAL_ERROR',
            'Failed to update referral request'
        );
    }
};

export const deleteReferralRequest = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;

        // Verify referral request belongs to user
        const existing = await prisma.referralRequest.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!existing) {
            sendErrorResponse(res, 404, 'NOT_FOUND', 'Referral request not found');
            return;
        }

        // If this referral had a relationshipImpact, reverse it on the contact when deleting
        if (existing.relationshipImpact !== null && existing.relationshipImpact !== undefined) {
            try {
                const contact = await prisma.professionalContact.findFirst({
                    where: {
                        id: existing.contactId,
                        userId,
                    },
                });

                if (contact) {
                    const currentStrength = contact.relationshipStrength ?? 50;
                    // Reverse the original impact
                    const newStrength = Math.max(
                        0,
                        Math.min(100, currentStrength - existing.relationshipImpact)
                    );

                    await prisma.professionalContact.update({
                        where: { id: contact.id },
                        data: {
                            relationshipStrength: newStrength,
                        },
                    });
                }
            } catch (contactUpdateError) {
                console.error(
                    '[Delete Referral Request] Failed to reverse relationshipStrength on contact',
                    contactUpdateError
                );
            }
        }

        await prisma.referralRequest.delete({
            where: { id },
        });

        res.status(204).send();
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                sendErrorResponse(res, 404, 'NOT_FOUND', 'Referral request not found');
                return;
            }
        }
        console.error('[Delete Referral Request Error]', error);
        sendErrorResponse(
            res,
            500,
            'INTERNAL_ERROR',
            'Failed to delete referral request'
        );
    }
};

export const getPotentialReferralSources = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.userId!;
        const { jobId } = req.params;

        // Get job details
        const job = await prisma.jobOpportunity.findFirst({
            where: {
                id: jobId,
                userId,
            },
        });

        if (!job) {
            sendErrorResponse(res, 404, 'NOT_FOUND', 'Job opportunity not found');
            return;
        }

        // Find contacts that are linked to this job
        // Only show contacts that have this job in their linkedJobIds
        const contacts = await prisma.professionalContact.findMany({
            where: {
                userId,
                linkedJobIds: {
                    has: jobId, // Only contacts that have this jobId in their linkedJobIds array
                },
            },
            orderBy: [
                { relationshipStrength: 'desc' }, // Strong relationships first
            ],
            take: 50,
        });

        // Calculate optimal timing score for each contact
        const contactsWithScores = await Promise.all(
            contacts.map(async (contact) => {
                const lastInteraction = await prisma.contactInteraction.findFirst({
                    where: { contactId: contact.id },
                    orderBy: { interactionDate: 'desc' },
                });

                let optimalTimingScore = 50;
                let timingReason = '';

                // Calculate timing score based on:
                // 1. Last contact date (recent = better)
                // 2. Relationship strength
                // 3. Existing referral requests to this contact
                const daysSinceLastContact = contact.lastContactDate
                    ? Math.floor(
                        (Date.now() - new Date(contact.lastContactDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                    : 365;

                if (daysSinceLastContact < 30) {
                    optimalTimingScore += 20;
                    timingReason = 'Recent contact - good timing';
                } else if (daysSinceLastContact < 90) {
                    optimalTimingScore += 10;
                    timingReason = 'Moderate time since last contact';
                } else {
                    optimalTimingScore -= 10;
                    timingReason = 'Long time since last contact - consider reconnecting first';
                }

                if (contact.relationshipStrength && contact.relationshipStrength >= 70) {
                    optimalTimingScore += 20;
                    timingReason += ' - Strong relationship';
                } else if (contact.relationshipStrength && contact.relationshipStrength < 50) {
                    optimalTimingScore -= 15;
                    timingReason += ' - Weak relationship - build rapport first';
                }

                // Check for existing referral requests
                const existingRequests = await prisma.referralRequest.count({
                    where: {
                        contactId: contact.id,
                        status: { in: ['pending', 'sent'] },
                    },
                });

                if (existingRequests > 0) {
                    optimalTimingScore -= 10;
                    timingReason += ' - Already has pending referral request';
                }

                optimalTimingScore = Math.max(0, Math.min(100, optimalTimingScore));

                return {
                    ...contact,
                    optimalTimingScore,
                    timingReason,
                    daysSinceLastContact,
                    existingReferralRequests: existingRequests,
                };
            })
        );

        // Sort by optimal timing score
        contactsWithScores.sort((a, b) => b.optimalTimingScore - a.optimalTimingScore);

        res.status(200).json({
            job,
            potentialSources: contactsWithScores,
        });
    } catch (error) {
        console.error('[Get Potential Referral Sources Error]', error);
        sendErrorResponse(
            res,
            500,
            'INTERNAL_ERROR',
            'Failed to fetch potential referral sources'
        );
    }
};

export const generateReferralTemplateForRequest = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.userId!;
        const { jobId, contactId } = req.body;

        if (!jobId || !contactId) {
            sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'jobId and contactId are required');
            return;
        }

        const [job, contact, userProfile] = await Promise.all([
            prisma.jobOpportunity.findFirst({
                where: { id: jobId, userId },
            }),
            prisma.professionalContact.findFirst({
                where: { id: contactId, userId },
                include: {
                    interactions: {
                        orderBy: { interactionDate: 'desc' },
                        take: 1,
                    },
                },
            }),
            prisma.userProfile.findUnique({
                where: { userId },
            }),
        ]);

        if (!job) {
            sendErrorResponse(res, 404, 'NOT_FOUND', 'Job opportunity not found');
            return;
        }

        if (!contact) {
            sendErrorResponse(res, 404, 'NOT_FOUND', 'Contact not found');
            return;
        }

        const template = generateReferralTemplate({
            contact: {
                fullName: contact.fullName,
                firstName: contact.firstName || undefined,
                relationshipType: contact.relationshipType || undefined,
                company: contact.company || undefined,
                jobTitle: contact.jobTitle || undefined,
            },
            job: {
                title: job.title,
                company: job.company,
                location: job.location || undefined,
            },
            userFirstName: userProfile?.firstName || userProfile?.preferredName || undefined,
            relationshipStrength: contact.relationshipStrength || undefined,
            lastContactDate: contact.lastContactDate?.toISOString() || undefined,
            mutualConnections: contact.mutualConnections || undefined,
        });

        res.status(200).json({
            template,
            contact,
            job,
        });
    } catch (error) {
        console.error('[Generate Referral Template Error]', error);
        sendErrorResponse(
            res,
            500,
            'INTERNAL_ERROR',
            'Failed to generate referral template'
        );
    }
};

export const getReferralAnalytics = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.userId!;

        const allRequests = await prisma.referralRequest.findMany({
            where: { userId },
            include: {
                jobOpportunity: true,
                contact: true,
            },
        });

        const total = allRequests.length;
        const byStatus = allRequests.reduce((acc, req) => {
            acc[req.status] = (acc[req.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Count successful referrals: accepted or completed status, or success=true
        const successful = allRequests.filter((r) =>
            r.status === 'accepted' ||
            r.status === 'completed' ||
            r.success === true
        ).length;

        // Only count referrals that have been responded to (accepted, declined, or completed)
        const respondedRequests = allRequests.filter((r) =>
            r.status === 'accepted' ||
            r.status === 'declined' ||
            r.status === 'completed'
        );
        const respondedCount = respondedRequests.length;

        // Calculate success rate based on responded requests only
        const successRate = respondedCount > 0 ? (successful / respondedCount) * 100 : 0;

        const byContact = allRequests.reduce((acc, req) => {
            const contactName = req.contact.fullName;
            if (!acc[contactName]) {
                acc[contactName] = { total: 0, successful: 0 };
            }
            // Only count responded requests (accepted, declined, completed)
            if (req.status === 'accepted' || req.status === 'declined' || req.status === 'completed') {
                acc[contactName].total++;
                if (req.status === 'accepted' || req.status === 'completed' || req.success === true) {
                    acc[contactName].successful++;
                }
            }
            return acc;
        }, {} as Record<string, { total: number; successful: number }>);

        // Calculate average relationship impact only from requests that have been responded to
        const respondedRequestsWithImpact = allRequests.filter((r) =>
            (r.status === 'accepted' || r.status === 'declined' || r.status === 'completed') &&
            r.relationshipImpact !== null &&
            r.relationshipImpact !== undefined
        );

        const avgRelationshipImpact = respondedRequestsWithImpact.length > 0
            ? respondedRequestsWithImpact.reduce((sum, r) => sum + (r.relationshipImpact || 0), 0) / respondedRequestsWithImpact.length
            : 0;

        res.status(200).json({
            total,
            byStatus,
            successRate: Math.round(successRate * 100) / 100,
            successful,
            responded: respondedCount,
            byContact,
            avgRelationshipImpact: Math.round(avgRelationshipImpact * 100) / 100,
        });
    } catch (error) {
        console.error('[Get Referral Analytics Error]', error);
        sendErrorResponse(
            res,
            500,
            'INTERNAL_ERROR',
            'Failed to fetch referral analytics'
        );
    }
};

