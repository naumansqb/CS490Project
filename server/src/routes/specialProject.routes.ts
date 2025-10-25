import { Router } from "express";
import * as specialProjectController from "../controllers/specialProject.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, specialProjectController.createSpecialProject);
router.get("/:id", authMiddleware, specialProjectController.getSpecialProject);
router.get(
  "/user/:userId",
  authMiddleware,
  specialProjectController.getSpecialProjectsByUserId
);
router.patch(
  "/:id",
  authMiddleware,
  specialProjectController.updateSpecialProject
);
router.delete(
  "/:id",
  authMiddleware,
  specialProjectController.deleteSpecialProject
);

export default router;
