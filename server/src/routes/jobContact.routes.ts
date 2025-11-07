// routes/jobContact.routes.ts
import { Router } from "express";
import * as jobContactController from "../controllers/jobContact.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, jobContactController.createJobContact);
router.get("/:id", authMiddleware, jobContactController.getJobContact);
router.get(
  "/job/:jobId",
  authMiddleware,
  jobContactController.getJobContactsByJobId
);
router.patch("/:id", authMiddleware, jobContactController.updateJobContact);
router.delete("/:id", authMiddleware, jobContactController.deleteJobContact);

export default router;
