import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/me", authMiddleware, userController.getCurrentUser);
router.put("/me", authMiddleware, userController.updateCurrentUser);

export default router;
