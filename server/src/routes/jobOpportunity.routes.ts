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

// Get all archived jobs for user
router.get(
  "/archived/user/:userId",
  authMiddleware,
  jobOpportunityController.getArchivedJobs
);

// Archive a single job
router.post(
  "/:id/archive",
  authMiddleware,
  jobOpportunityController.archiveJobOpportunity
);

// Bulk archive jobs
router.post(
  "/bulk/archive",
  authMiddleware,
  jobOpportunityController.bulkArchiveJobs
);

// Restore archived job
router.post(
  "/:id/restore",
  authMiddleware,
  jobOpportunityController.restoreJobOpportunity
);

// Permanently delete job (requires confirmation)
router.delete(
  "/:id/permanent",
  authMiddleware,
  jobOpportunityController.permanentlyDeleteJob
);

export default router;
