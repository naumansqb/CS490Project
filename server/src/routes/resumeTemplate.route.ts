//server/src/routes/resumeTemplate.route.ts

import { Router } from "express";
import * as resumeTemplateController from "../controllers/resumeTemplate.controller";

const router = Router();

router.get("/", resumeTemplateController.getAllTemplates);
router.get("/:id", resumeTemplateController.getTemplateById);

export default router;
