// routes/jobOpportunity.routes.ts
import { Router } from "express";
import * as jobOpportunityController from "../controllers/jobOpportunity.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, jobOpportunityController.createJobOpportunity);
router.get("/:id", authMiddleware, jobOpportunityController.getJobOpportunity);
router.get(
  "/user/:userId",
  authMiddleware,
  jobOpportunityController.getJobOpportunitiesByUserId
);
router.patch(
  "/:id",
  authMiddleware,
  jobOpportunityController.updateJobOpportunity
);
router.delete(
  "/:id",
  authMiddleware,
  jobOpportunityController.deleteJobOpportunity
);

export default router;
