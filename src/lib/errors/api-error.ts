/**
 * Application-level API error with HTTP status code and optional error code.
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode = 400, code = "BAD_REQUEST") {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Maps unknown errors to a safe client-facing message.
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (process.env.NODE_ENV === "development" && error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}
