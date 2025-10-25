import { Router } from "express";
import * as certificationController from "../controllers/certification.controller";

const router = Router();

router.post("/", certificationController.createCertification);
router.get("/:id", certificationController.getCertification);
router.get("/user/:userId", certificationController.getCertificationsByUserId);
router.patch("/:id", certificationController.updateCertification);
router.delete("/:id", certificationController.deleteCertification);

export default router;
