import type { NextFunction, Request, Response } from "express";
import type { ApiError } from "@martylab/shared";
import { AppError, isAppError } from "../lib/errors.js";
import type { Logger } from "../lib/logger.js";

export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  // Le chemin est inclus dans le message : sans lui, un 404 côté interface est
  // impossible à diagnostiquer (le client ne voit qu'un code générique).
  next(
    new AppError(
      404,
      "not_found",
      `No route matches ${req.method} ${req.originalUrl}.`,
    ),
  );
}

export function createErrorHandler(logger: Logger, isProduction: boolean) {
  return function errorHandler(
    error: unknown,
    req: Request,
    res: Response,
    _next: NextFunction,
  ): void {
    if (isAppError(error)) {
      const message =
        isProduction && error.statusCode >= 500
          ? "An unexpected error occurred."
          : error.message;

      // 4xx = erreur d'appel, pas incident serveur : une ligne exploitable
      // (méthode, chemin, code) suffit. Empiler la stack pour un 404 noie le
      // terminal et laisse croire à un crash.
      if (error.statusCode >= 500) {
        logger.error(
          {
            err: error,
            method: req.method,
            url: req.originalUrl,
            statusCode: error.statusCode,
            code: error.code,
          },
          "Unhandled server error",
        );
      } else {
        logger.warn(
          {
            method: req.method,
            url: req.originalUrl,
            statusCode: error.statusCode,
            code: error.code,
            message: error.message,
          },
          "Request failed",
        );
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

    logger.error(
      { err: error, method: req.method, url: req.originalUrl },
      "Unexpected non-AppError failure",
    );

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
