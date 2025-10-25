import { Router } from 'express';
import * as educationController from '../controllers/education.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authMiddleware, educationController.createEducation);
router.get('/:id', authMiddleware, educationController.getEducation);
router.get('/user/:userId', authMiddleware, educationController.getEducationsByUserId);
router.patch('/:id', authMiddleware, educationController.updateEducation);
router.delete('/:id', authMiddleware, educationController.deleteEducation);

export default router;