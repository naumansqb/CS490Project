import { Router } from "express";
import * as skillController from "../controllers/skill.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, skillController.createSkill);
router.get("/:id", authMiddleware, skillController.getSkill);
router.get("/user/:userId", authMiddleware, skillController.getSkillsByUserId);
router.patch("/:id", authMiddleware, skillController.updateSkill);
router.delete("/:id", authMiddleware, skillController.deleteSkill);

export default router;
