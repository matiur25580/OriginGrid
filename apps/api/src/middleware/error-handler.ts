import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 500,
    public readonly code = "INTERNAL_SERVER_ERROR"
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.path}`, 404, "ROUTE_NOT_FOUND"));
};

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Request validation failed", details: error.flatten() }
    });
    return;
  }

  const appError = error instanceof AppError ? error : new AppError("An unexpected error occurred");
  if (!(error instanceof AppError)) {
    // Detailed errors belong in structured server logs, never in public API responses.
    console.error(error);
  }

  res.status(appError.statusCode).json({
    success: false,
    error: { code: appError.code, message: appError.message }
  });
};
