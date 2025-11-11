// routes/coverLetter.routes.ts
import { Router } from "express";
import * as coverLetterController from "../controllers/coverLetter.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, coverLetterController.createCoverLetter);
router.get("/:id", authMiddleware, coverLetterController.getCoverLetter);
router.get(
  "/user/:userId",
  authMiddleware,
  coverLetterController.getCoverLettersByUserId
);
router.get(
  "/job/:jobId",
  authMiddleware,
  coverLetterController.getCoverLettersByJobId
);
router.patch(
  "/:id",
  authMiddleware,
  coverLetterController.updateCoverLetter
);
router.delete(
  "/:id",
  authMiddleware,
  coverLetterController.deleteCoverLetter
);

export default router;
