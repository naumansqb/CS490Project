import { Router } from "express";
import * as skillController from "../controllers/skill.controller";

const router = Router();

router.post("/", skillController.createSkill);
router.get("/:id", skillController.getSkill);
router.get("/user/:userId", skillController.getSkillsByUserId);
router.patch("/:id", skillController.updateSkill);
router.delete("/:id", skillController.deleteSkill);

export default router;
