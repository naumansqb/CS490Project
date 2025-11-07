import { Router } from "express";
import * as aiController from "../controllers/ai.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/resume/tailor", aiController.generateTailoredResume);
router.post("/cover-letter/generate", aiController.generateCoverLetter);

export default router;
