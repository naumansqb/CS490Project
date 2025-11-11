// controllers/interviews.controller.ts
import { Response } from 'express';
import { prisma } from '../db';
import { Prisma } from '@prisma/client';
import {
  validateCreateInterview,
  validateUpdateInterview,
} from '../validators/interview.validator';
import { sendErrorResponse } from '../utils/errorResponse';
import { AuthRequest } from '../middleware/auth.middleware';

// Create Interview
export const createInterviews = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { jobId } = req.body;

    // Check if job exists and belongs to user
    const job = await prisma.jobOpportunity.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      sendErrorResponse(res, 404, 'NOT_FOUND', 'Job opportunity not found');
      return;
    }

    if (job.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        'FORBIDDEN',
        'Not authorized to create interview for this job'
      );
      return;
    }

    // Validate input
    const validationErrors = validateCreateInterview(req.body);
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

    // Check if interview already exists for this job
    const existingInterview = await prisma.interviews.findFirst({
      where: {
        job_id: jobId,
        status: { in: ['scheduled', 'rescheduled'] },
      },
    });

    if (existingInterview) {
      sendErrorResponse(
        res,
        409,
        'CONFLICT',
        'An active interview already exists for this job opportunity'
      );
      return;
    }

    // Create interview
    const interview = await prisma.interviews.create({
      data: {
        job_id: jobId,
        scheduled_date: new Date(req.body.scheduledDate),
        interview_type: req.body.interviewType,
        duration_minutes: req.body.durationMinutes || 60,
        status: req.body.status || 'scheduled',
        location: req.body.location || null,
        meeting_link: req.body.meetingLink || null,
        phone_number: req.body.phoneNumber || null,
        interviewer_name: req.body.interviewerName || null,
      },
    });

    res.status(201).json(interview);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        sendErrorResponse(res, 404, 'NOT_FOUND', 'Job opportunity not found');
        return;
      }
    }
    console.error('Error creating interview:', error);
    sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to create interview');
  }
};

// Get interviews by ID
export const getInterviewsById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    console.log('Auth userId:', userId);
    console.log('JobId:', id);

    const interviews = await prisma.interviews.findUnique({
      where: { id },
      include: {
        job_opportunity: true,
      },
    });

    if (!interviews) {
      sendErrorResponse(res, 404, 'NOT_FOUND', 'interviews not found');
      return;
    }

    // Authorization check
    if (interviews.job_opportunity.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        'FORBIDDEN',
        'Not authorized to access this interviews'
      );
      return;
    }

    res.json(interviews);
  } catch (error) {
    console.error('Error fetching interviews:', error);
    sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to fetch interviews');
  }
};

// Get interviews by Job ID
export const getInterviewsByJobId = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { jobId } = req.params;

    console.log('Auth userId:', userId);
    console.log('JobId:', jobId);

    // Check if job exists and belongs to user
    const job = await prisma.jobOpportunity.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      sendErrorResponse(res, 404, 'NOT_FOUND', 'Job opportunity not found');
      return;
    }

    if (job.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        'FORBIDDEN',
        'Not authorized to access interviews for this job test'
      );
      return;
    }

    // Get interviews for this job
    const interviews = await prisma.interviews.findFirst({
      where: { job_id: jobId },
      orderBy: { scheduled_date: 'desc' },
    });

    // Return null if no interviews exists (since it's one per job)
    res.json(interviews || null);
  } catch (error) {
    console.error('Error fetching interviews by job:', error);
    sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to fetch interviews');
  }
};

// Get All User's interviews (with optional filters)
export const getUserInterviews = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { status, fromDate, toDate } = req.query;

    const where: any = {
      job_opportunity: {
        userId,
      },
    };

    if (status) {
      where.status = status;
    }

    if (fromDate || toDate) {
      where.scheduledDate = {};
      if (fromDate) {
        where.scheduledDate.gte = new Date(fromDate as string);
      }
      if (toDate) {
        where.scheduledDate.lte = new Date(toDate as string);
      }
    }

    const interviews = await prisma.interviews.findMany({
      where,
      include: {
        job_opportunity: {
          select: {
            id: true,
            title: true,
            company: true,
            industry: true,
            jobType: true,
          },
        },
      },
      orderBy: { scheduled_date: 'asc' },
    });

    res.json(interviews);
  } catch (error) {
    console.error('Error fetching interviews:', error);
    sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to fetch interviews');
  }
};

// Get Upcoming interviews (next 30 days)
export const getUpcomingInterviews = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const interviews = await prisma.interviews.findMany({
      where: {
        job_opportunity: {
          userId,
        },
        status: 'scheduled',
        scheduled_date: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
      include: {
        job_opportunity: {
          select: {
            id: true,
            title: true,
            company: true,
            industry: true,
            jobType: true,
            location: true,
          },
        },
      },
      orderBy: { scheduled_date: 'asc' },
    });

    res.json(interviews);
  } catch (error) {
    console.error('Error fetching upcoming interviews:', error);
    sendErrorResponse(
      res,
      500,
      'INTERNAL_ERROR',
      'Failed to fetch upcoming interviews'
    );
  }
};

// Update interviews
export const updateInterviews = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Check if interviews exists
    const existinginterviews = await prisma.interviews.findUnique({
      where: { id },
      include: {
        job_opportunity: true,
      },
    });

    if (!existinginterviews) {
      sendErrorResponse(res, 404, 'NOT_FOUND', 'interviews not found');
      return;
    }

    // Authorization check
    if (existinginterviews.job_opportunity.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        'FORBIDDEN',
        'Not authorized to update this interviews'
      );
      return;
    }

    // Validate input
    const validationErrors = validateUpdateInterview(req.body);
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

    // Update interviews
    const interviews = await prisma.interviews.update({
      where: { id },
      data: req.body,
    });

    res.json(interviews);
  } catch (error) {
    console.error('Error updating interviews:', error);
    sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to update interviews');
  }
};

// Delete interviews
export const deleteInterviews = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Check if interviews exists
    const existinginterviews = await prisma.interviews.findUnique({
      where: { id },
      include: {
        job_opportunity: true,
      },
    });

    if (!existinginterviews) {
      sendErrorResponse(res, 404, 'NOT_FOUND', 'interviews not found');
      return;
    }

    // Authorization check
    if (existinginterviews.job_opportunity.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        'FORBIDDEN',
        'Not authorized to delete this interviews'
      );
      return;
    }

    // Delete interviews
    await prisma.interviews.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting interviews:', error);
    sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to delete interviews');
  }
};

// Cancel interviews (soft delete - updates status)
export const cancelInterviews = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Check if interviews exists
    const existinginterviews = await prisma.interviews.findUnique({
      where: { id },
      include: {
        job_opportunity: true,
      },
    });

    if (!existinginterviews) {
      sendErrorResponse(res, 404, 'NOT_FOUND', 'interviews not found');
      return;
    }

    // Authorization check
    if (existinginterviews.job_opportunity.userId !== userId) {
      sendErrorResponse(
        res,
        403,
        'FORBIDDEN',
        'Not authorized to cancel this interviews'
      );
      return;
    }

    // Check if interviews can be cancelled
    if (!['scheduled', 'rescheduled'].includes(existinginterviews.status)) {
      sendErrorResponse(
        res,
        400,
        'INVALID_STATUS',
        'interviews cannot be cancelled in its current status'
      );
      return;
    }

    // Update status to cancelled
    const interviews = await prisma.interviews.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    res.json(interviews);
  } catch (error) {
    console.error('Error cancelling interviews:', error);
    sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to cancel interviews');
  }
};