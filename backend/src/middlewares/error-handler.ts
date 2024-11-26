import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { status } from "../config/http.config";

export const errorHandler: ErrorRequestHandler = (
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
  }

  res.status(status.INTERNAL_SERVER_ERROR).json({
    message: "Internal server error",
    error: error?.message || "Unknown error occurred.",
  });

  next();
};
