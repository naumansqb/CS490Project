// routes/company.routes.ts
import { Router } from "express";
import * as companyController from "../controllers/company.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, companyController.createCompany);
router.get("/", authMiddleware, companyController.listCompanies);
router.get("/:id", authMiddleware, companyController.getCompany);
router.patch("/:id", authMiddleware, companyController.updateCompany);
router.delete("/:id", authMiddleware, companyController.deleteCompany);

// Research company using AI
router.post("/research", companyController.researchCompany);

// Get recent company news and updates
router.post("/news", companyController.getCompanyNews);

// Research company and save to database
router.post("/research-and-save", companyController.researchAndSaveCompany);

// Company news endpoints (by companyName - must come BEFORE dynamic routes)
router.post("/news/refresh", companyController.refreshCompanyNewsByName);
router.get("/news/export", companyController.exportCompanyNewsByName);

// Company news endpoints (by companyId - dynamic routes must come after static)
router.post("/:companyId/news/refresh", companyController.refreshCompanyNews);
router.get("/:companyId/news/export", companyController.exportCompanyNews);

// Company follow endpoints (must come after other dynamic routes)
router.get("/:companyId/follow", authMiddleware, companyController.checkFollowStatus);
router.post("/:companyId/follow", authMiddleware, companyController.followCompany);
router.delete("/:companyId/follow", authMiddleware, companyController.unfollowCompany);

// News alerts endpoint (must come before dynamic routes)
router.get("/news/alerts", authMiddleware, companyController.getNewsAlerts);

export default router;
