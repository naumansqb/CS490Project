// routes/applicationHistory.routes.ts
import { Router } from "express";
import * as applicationHistoryController from "../controllers/applicationHistory.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post(
  "/",
  authMiddleware,
  applicationHistoryController.createApplicationHistory
);
router.get(
  "/:id",
  authMiddleware,
  applicationHistoryController.getApplicationHistory
);
router.get(
  "/job/:jobId",
  authMiddleware,
  applicationHistoryController.getApplicationHistoryByJobId
);
router.patch(
  "/:id",
  authMiddleware,
  applicationHistoryController.updateApplicationHistory
);
router.delete(
  "/:id",
  authMiddleware,
  applicationHistoryController.deleteApplicationHistory
);

export default router;
