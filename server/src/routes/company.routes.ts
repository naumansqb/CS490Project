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

export default router;
