import { Router } from "express";
import * as certificationController from "../controllers/certification.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, certificationController.createCertification);
router.get("/:id", authMiddleware, certificationController.getCertification);
router.get("/user/:userId", authMiddleware, certificationController.getCertificationsByUserId);
router.patch("/:id", authMiddleware, certificationController.updateCertification);
router.delete("/:id", authMiddleware, certificationController.deleteCertification);

export default router;
