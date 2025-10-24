import { Router } from 'express';
import userProfileRoutes from './userProfile.routes';
import workExperienceRoutes from './workExperience.routes';
import educationRoutes from './education.routes';

const router = Router();

router.use('/user-profiles', userProfileRoutes);
router.use('/work-experiences', workExperienceRoutes);
router.use('/educations', educationRoutes);

export default router;