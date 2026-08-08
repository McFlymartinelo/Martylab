export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    options?: { cause?: unknown; isOperational?: boolean },
  ) {
    super(message, options?.cause ? { cause: options.cause } : undefined);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = options?.isOperational ?? true;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
