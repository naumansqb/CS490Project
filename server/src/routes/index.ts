import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import userProfileRoutes from './userProfile.routes';
import workExperienceRoutes from './workExperience.routes';
import educationRoutes from './education.routes';
import skillRoutes from './skill.routes';
import certificationRoutes from './certification.routes';
import specialProjectRoutes from './specialProject.routes';
import resumeRoutes from './resume.routes';
import resumeTemplateRoutes from './resumeTemplate.route';


const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/user-profiles', userProfileRoutes);
router.use('/work-experiences', workExperienceRoutes);
router.use('/educations', educationRoutes);
router.use('/skills', skillRoutes);
router.use('/certifications', certificationRoutes);
router.use('/special-projects', specialProjectRoutes);
router.use('/resumes', resumeRoutes);
router.use('/resume-templates', resumeTemplateRoutes);



export default router;