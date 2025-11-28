// routes/materials.routes.ts
import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  getMaterials,
  upsertMaterials,
  setMaterialDefaults,
  materialsAnalytics,
} from "../controllers/materials.controller";

const router = Router();

// Read current materials + history for a job
router.get("/jobs/:id/materials", authMiddleware, getMaterials);

// Create/Update current materials and append to history
router.post("/jobs/:id/materials", authMiddleware, upsertMaterials);

// Set per-job defaults (optional helper)
router.patch("/jobs/:id/materials/defaults", authMiddleware, setMaterialDefaults);

// Basic usage analytics (across user’s jobs)
router.get("/jobs/:id/materials/analytics", authMiddleware, materialsAnalytics);

export default router;
