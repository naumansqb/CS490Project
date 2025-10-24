import { Response } from "express";
import { ErrorResponse } from "../types/errors";

export const sendErrorResponse = (
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: Array<{ field: string; message: string }>
): void => {
  console.error(
    `[${new Date().toISOString()}] Error ${statusCode} - ${code}: ${message}`,
    details || ""
  );

  const errorResponse: ErrorResponse = {
    code,
    message,
    ...(details && { details }),
  };

  res.status(statusCode).json(errorResponse);
};
