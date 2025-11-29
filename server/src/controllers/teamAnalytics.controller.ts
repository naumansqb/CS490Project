import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { sendErrorResponse } from "../utils/errorResponse";
import { calculateTeamAnalytics } from "../services/teamAnalytics.service";

export const getTeamAnalytics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { teamId } = req.params;

    const analytics = await calculateTeamAnalytics(teamId);

    res.json(analytics);
  } catch (error) {
    console.error("Error fetching team analytics:", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch team analytics"
    );
  }
};
