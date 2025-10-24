import { Router } from 'express';
import * as userProfileController from '../controllers/userProfile.controller';

const router = Router();

router.post('/', userProfileController.createUserProfile);
router.get('/', userProfileController.listUserProfiles);
router.get('/:id', userProfileController.getUserProfile);
router.get('/user/:userId', userProfileController.getUserProfileByUserId);
router.patch('/:id', userProfileController.updateUserProfile);
router.delete('/:id', userProfileController.deleteUserProfile);

export default router;