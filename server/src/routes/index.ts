import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import userProfileRoutes from "./userProfile.routes";
import workExperienceRoutes from "./workExperience.routes";
import educationRoutes from "./education.routes";
import skillRoutes from "./skill.routes";
import certificationRoutes from "./certification.routes";
import specialProjectRoutes from "./specialProject.routes";
import resumeRoutes from "./resume.routes";
import resumeTemplateRoutes from "./resumeTemplate.route";

import jobOpportunityRoutes from "./jobOpportunity.routes";
import jobContactRoutes from "./jobContact.routes";
import applicationHistoryRoutes from "./applicationHistory.routes";
import aiRoutes from "./ai.routes";
import companyRoutes from "./company.routes";

import materialsRoutes from "./materials.routes";
const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/user-profiles", userProfileRoutes);
router.use("/work-experiences", workExperienceRoutes);
router.use("/educations", educationRoutes);
router.use("/skills", skillRoutes);
router.use("/certifications", certificationRoutes);
router.use("/special-projects", specialProjectRoutes);
router.use("/resumes", resumeRoutes);
router.use("/resume-templates", resumeTemplateRoutes);

router.use("/job-opportunities", jobOpportunityRoutes);
router.use("/job-contacts", jobContactRoutes);
router.use("/application-history", applicationHistoryRoutes);
router.use("/", materialsRoutes);
router.use("/ai", aiRoutes);
router.use("/companies", companyRoutes);

export default router;
