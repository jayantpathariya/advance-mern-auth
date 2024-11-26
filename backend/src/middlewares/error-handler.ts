import { ZodError } from "zod";
import { Request, Response, NextFunction, ErrorRequestHandler } from "express";

import { status } from "@config/http.config";
import { AppError } from "@common/utils/app-error";
import { config } from "@config/app.config";
import { clearAuthenticationCookie, REFRESH_PATH } from "@/common/utils/cookie";

const formatZodError = (res: Response, error: ZodError) => {
  const errors = error?.issues?.map((err) => ({
    fields: err.path.join("."),
    message: err.message,
  }));

  res.status(status.BAD_REQUEST).json({
    message: "Validation failed",
    errors,
  });
};

export const errorHandler: ErrorRequestHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(`Error occurred on PATH: ${req.path}`, error);

  if (req.path === REFRESH_PATH) {
    clearAuthenticationCookie(res);
  }

  if (error instanceof SyntaxError) {
    res.status(status.BAD_REQUEST).json({
      message: "Invalid JSON format, please check your request body.",
    });
    return;
  }

  if (error instanceof ZodError) {
    formatZodError(res, error);
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
    error: config.NODE_ENV === "development" ? error : undefined,
  });
};
