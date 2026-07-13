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
 * Never returns database/SQL/path details in production.
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (process.env.NODE_ENV === "development" && error instanceof Error) {
    return error.message;
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    // Allow known safe, user-facing messages through
    if (
      msg.includes("forbidden") ||
      msg.includes("unauthorized") ||
      msg.includes("too many") ||
      msg.includes("rate") ||
      msg.includes("invalid") ||
      msg.includes("required") ||
      msg.includes("not found") ||
      msg.includes("must be") ||
      msg.includes("only ") ||
      msg.includes("exceeds") ||
      msg.includes("allowed")
    ) {
      // Still strip anything that looks like SQL / Postgres
      if (
        msg.includes("postgres") ||
        msg.includes("supabase") ||
        msg.includes("pgrst") ||
        msg.includes("permission denied for") ||
        msg.includes("violates") ||
        msg.includes("relation ") ||
        msg.includes("column ")
      ) {
        return "An unexpected error occurred. Please try again.";
      }
      return error.message;
    }
  }

  return "An unexpected error occurred. Please try again.";
}
