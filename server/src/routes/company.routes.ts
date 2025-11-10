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

export default router;
