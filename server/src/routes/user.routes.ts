import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/me", authMiddleware, userController.getCurrentUser);
router.put("/me", authMiddleware, userController.updateCurrentUser);
router.delete("/me", authMiddleware, userController.deleteUserAccount);

// Email deletion
router.post('/send-deletion-email', userController.sendDeletionEmail);

export default router;