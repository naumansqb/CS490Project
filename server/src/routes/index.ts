import { Router } from "express";
import userProfileRoutes from "./userProfile.routes";
import workExperienceRoutes from "./workExperience.routes";
import educationRoutes from "./education.routes";
import skillRoutes from "./skill.routes";
import certificationRoutes from "./certification.routes";
import specialProjectRoutes from "./specialProject.routes";

const router = Router();

router.use("/user-profiles", userProfileRoutes);
router.use("/work-experiences", workExperienceRoutes);
router.use("/educations", educationRoutes);
router.use("/skills", skillRoutes);
router.use("/certifications", certificationRoutes);
router.use("/special-projects", specialProjectRoutes);

export default router;
