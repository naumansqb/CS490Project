import { Router } from "express";
import * as aiController from "../controllers/ai.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/resume/tailor", aiController.generateTailoredResume);
router.post("/resume/:resumeId/tailor-to-job", aiController.tailorResumeToJob);
router.post(
    "/resume/parse",
    aiController.upload.single("file"),
    aiController.parseResumeFromFile
);
router.post("/cover-letter/generate", aiController.generateCoverLetter);
router.post("/company-research", aiController.researchCompany);
router.post("/editing-suggestions", aiController.getEditingSuggestions);

export default router;
