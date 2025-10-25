import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { sendErrorResponse } from "../utils/errorResponse";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

interface AuthRequest extends Request {
  userId?: string;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.cookies.session;

    if (!token) {
      sendErrorResponse(res, 401, "UNAUTHORIZED", "Authentication required");
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { uid: string };
    req.userId = decoded.uid;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      sendErrorResponse(res, 401, "UNAUTHORIZED", "Invalid or expired session");
      return;
    }
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Authentication verification failed"
    );
  }
};

export { AuthRequest };
