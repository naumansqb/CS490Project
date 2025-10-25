import { Router } from 'express';
import * as userProfileController from '../controllers/userProfile.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authMiddleware, userProfileController.createUserProfile);
router.get('/:userId', authMiddleware, userProfileController.getUserProfile);
router.patch('/:userId', authMiddleware, userProfileController.updateUserProfile);
router.delete('/:userId', authMiddleware, userProfileController.deleteUserProfile);

export default router;