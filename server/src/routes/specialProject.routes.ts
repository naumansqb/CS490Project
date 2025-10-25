import { Router } from "express";
import * as specialProjectController from "../controllers/specialProject.controller";

const router = Router();

router.post("/", specialProjectController.createSpecialProject);
router.get("/:id", specialProjectController.getSpecialProject);
router.get(
  "/user/:userId",
  specialProjectController.getSpecialProjectsByUserId
);
router.patch("/:id", specialProjectController.updateSpecialProject);
router.delete("/:id", specialProjectController.deleteSpecialProject);

export default router;
