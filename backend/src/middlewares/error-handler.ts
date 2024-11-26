import { Request, Response, NextFunction } from "express";

import { status } from "../config/http.config";
import { AppError } from "../common/utils/app-error";
import { config } from "../config/app.config";

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(`Error occurred on PATH: ${req.path}`, error);

  if (error instanceof SyntaxError) {
    res.status(status.BAD_REQUEST).json({
      message: "Invalid JSON format, please check your request body.",
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      message: error.message,
      errorCode: error.errorCode,
    });
    return;
  }

  res.status(status.INTERNAL_SERVER_ERROR).json({
    message: "Internal server error",
    error: error?.message || "Unknown error occurred.",
    ...(config.NODE_ENV === "development" && { stack: error.stack }),
  });
  return;
};
