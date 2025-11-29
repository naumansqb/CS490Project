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

import jobOpportunityRoutes from "./jobOpportunity.routes";
import jobContactRoutes from "./jobContact.routes";
import applicationHistoryRoutes from "./applicationHistory.routes";
import aiRoutes from "./ai.routes";
import coverLetterRoutes from "./coverLetter.routes";
import companyRoutes from "./company.routes";
import interviewRoutes from "./interview.routes";
import professionalContactRoutes from "./professionalContact.routes";
import referralRequestRoutes from "./referralRequest.routes";
import teamRoutes from "./team.routes";
import teamInvitationRoutes from "./teamInvitation.routes";
import sharedJobRoutes from "./sharedJob.routes";
import teamTaskRoutes from "./teamTask.routes";
import teamFeedbackRoutes from "./teamFeedback.routes";
import teamActivityRoutes from "./teamActivity.routes";
import teamAnalyticsRoutes from "./teamAnalytics.routes";
import { authMiddleware } from "../middleware/auth.middleware";

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


router.use("/job-opportunities", jobOpportunityRoutes);
router.use("/job-contacts", jobContactRoutes);
router.use("/application-history", applicationHistoryRoutes);
router.use("/ai", aiRoutes);
router.use("/cover-letters", coverLetterRoutes);
router.use("/companies", companyRoutes);
router.use("/interviews", authMiddleware, interviewRoutes);
router.use("/professional-contacts", professionalContactRoutes);
router.use("/referral-requests", referralRequestRoutes);

// Team collaboration routes
router.use("/teams", teamRoutes);
router.use("/teams", teamInvitationRoutes);
router.use("/teams", sharedJobRoutes);
router.use("/teams", teamTaskRoutes);
router.use("/teams", teamFeedbackRoutes);
router.use("/teams", teamActivityRoutes);
router.use("/teams", teamAnalyticsRoutes);
router.use("/team-invitations", teamInvitationRoutes);

export default router;

