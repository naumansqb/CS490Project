import { Router } from "express";
import * as aiController from "../controllers/ai.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { analyzeInterviewResponse } from "../controllers/ai.controller";

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
router.put(
  '/interview-insights/checklist',
  authMiddleware,
  aiController.updateChecklistItem
);

router.put(
  '/interview-insights/checklist/bulk',
  authMiddleware,
  aiController.updateChecklistBulk
);
router.post("/interview/analyze", analyzeInterviewResponse);
router.post("/referral-template/generate", authMiddleware, aiController.generateReferralTemplate);

router.post(
  "/mock-interview/generate-questions",
  aiController.generateMockInterviewQuestions
);

router.post(
  "/mock-interview/evaluate-response",
  aiController.evaluateMockInterviewResponse
);

router.post(
  "/mock-interview/generate-summary",
  aiController.generateMockInterviewSummary
);

// LinkedIn integration routes
router.post("/linkedin/message", authMiddleware, aiController.generateLinkedInMessage);
router.post("/linkedin/optimization", authMiddleware, aiController.generateLinkedInOptimization);
router.post("/linkedin/networking-strategy", authMiddleware, aiController.generateNetworkingStrategy);
router.post("/linkedin/content-strategy", authMiddleware, aiController.generateContentSharingStrategy);
router.post("/linkedin/networking-campaign", authMiddleware, aiController.generateNetworkingCampaign);


export default router;
