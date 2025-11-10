import { Router } from 'express';
import * as resumeController from '../controllers/resume.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Get all resumes for the authenticated user
router.get('/', authMiddleware, resumeController.getResumesByAuthUser);
router.post('/', authMiddleware, resumeController.createResume);
router.get('/:id', authMiddleware, resumeController.getResumeById);
router.patch('/:id', authMiddleware, resumeController.updateResume);
router.delete('/:id', authMiddleware, resumeController.deleteResume);
router.patch('/:id/set-default', authMiddleware, resumeController.setDefaultResume);

export default router;