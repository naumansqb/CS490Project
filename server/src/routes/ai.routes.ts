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
router.post("/experience-analysis", aiController.analyzeExperienceRelevance);
router.post("/job/extract-from-url", aiController.extractJobFromUrl);
router.get(
  "/job-matching/preferences",
  authMiddleware,
  aiController.getJobMatchPreferences
);
router.put(
  "/job-matching/preferences",
  authMiddleware,
  aiController.updateJobMatchPreferences
);
router.get(
  "/job-matching/history/:jobId",
  authMiddleware,
  aiController.getJobMatchHistory
);
router.get(
  "/job-matching/comparison",
  authMiddleware,
  aiController.getJobMatchComparison
);
router.get(
  "/job-matching/export",
  authMiddleware,
  aiController.exportJobMatchAnalysis
);
router.post("/job-matching/analyze", authMiddleware, aiController.analyzeJobMatch);
router.post("/skills-gap/analyze", authMiddleware, aiController.analyzeSkillsGap);
router.get("/skills-gap/progress/:jobId", authMiddleware, aiController.getSkillsGapProgress);
router.get("/skills-gap/trends", authMiddleware, aiController.getSkillsGapTrends);
router.post("/interview-insights/analyze", authMiddleware, aiController.getInterviewInsights);

export default router;
