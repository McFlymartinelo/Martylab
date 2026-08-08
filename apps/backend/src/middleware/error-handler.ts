import type { NextFunction, Request, Response } from "express";
import type { ApiError } from "@martylab/shared";
import { AppError, isAppError } from "../lib/errors.js";
import type { Logger } from "../lib/logger.js";

export function notFoundHandler(
  _req: Request,
  _res: Response,
  next: NextFunction,
): void {
  next(new AppError(404, "not_found", "The requested resource was not found."));
}

export function createErrorHandler(logger: Logger, isProduction: boolean) {
  return function errorHandler(
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): void {
    if (isAppError(error)) {
      const message =
        isProduction && error.statusCode >= 500
          ? "An unexpected error occurred."
          : error.message;

      if (error.statusCode >= 500) {
        logger.error({ err: error }, "Unhandled server error");
      } else {
        logger.warn({ err: error }, "Request failed");
      }

      const body: ApiError = {
        error: {
          code: error.code,
          message,
        },
      };

      res.status(error.statusCode).json(body);
      return;
    }

    logger.error({ err: error }, "Unexpected non-AppError failure");

    const body: ApiError = {
      error: {
        code: "internal_error",
        message: isProduction
          ? "An unexpected error occurred."
          : error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      },
    };

    res.status(500).json(body);
  };
}
