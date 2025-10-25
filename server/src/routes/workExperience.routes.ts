import { Router } from "express";
import * as workExperienceController from "../controllers/workExperience.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, workExperienceController.createWorkExperience);
router.get("/:id", authMiddleware, workExperienceController.getWorkExperience);
router.get(
  "/user/:userId",
  authMiddleware,
  workExperienceController.getWorkExperiencesByUserId
);
router.patch(
  "/:id",
  authMiddleware,
  workExperienceController.updateWorkExperience
);
router.delete(
  "/:id",
  authMiddleware,
  workExperienceController.deleteWorkExperience
);

export default router;
