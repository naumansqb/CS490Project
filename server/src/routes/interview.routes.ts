import express from 'express';
import {
    cancelInterviews,
    createInterviews,
    deleteInterviews,
    getInterviewsById,
    getInterviewsByJobId,
    getUserInterviews,
    getUpcomingInterviews,
    updateInterviews,
} from '../controllers/interview.controller';

const router = express.Router();

// Create new interview
router.post('/', createInterviews);

// Get all interviews (with optional filters)
router.get('/', getUserInterviews);

// Get upcoming interviews (next 30 days)
router.get('/upcoming', getUpcomingInterviews);

// Get interview by ID
router.get('/:id', getInterviewsById);

// Get interview by job ID
router.get('/job/:jobId', getInterviewsByJobId);

// Update interview
router.patch('/:id', updateInterviews);

// Cancel interview (soft delete - updates status)
router.patch('/:id/cancel', cancelInterviews);

// Delete interview (hard delete)
router.delete('/:id', deleteInterviews);

export default router;