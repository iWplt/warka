import { ApiError, sanitizeErrorMessage } from "@/lib/errors/api-error";
import { isProductionRuntime } from "@/lib/security/is-production";

/**
 * Throws an Error with a client-safe message. Logs the real error server-side.
 */
export function throwSafeError(
  error: unknown,
  fallback = "An unexpected error occurred. Please try again."
): never {
  if (error instanceof ApiError) {
    throw error;
  }

  const internal =
    error instanceof Error ? error.message : typeof error === "string" ? error : "unknown";

  console.error("[safe-error]", internal);

  if (!isProductionRuntime() && error instanceof Error) {
    throw new Error(error.message);
  }

  throw new Error(fallback);
}

/** Map Supabase/storage errors to a generic message before throwing to the client. */
export function toClientError(error: unknown, fallback?: string): Error {
  if (error instanceof ApiError) return error;
  return new Error(sanitizeErrorMessage(error) === "An unexpected error occurred. Please try again."
    ? (fallback ?? "An unexpected error occurred. Please try again.")
    : sanitizeErrorMessage(error));
}

export function clientSafeMessage(error: unknown, fallbackAr = "حدث خطأ غير متوقع. حاول مرة أخرى."): string {
  if (error instanceof ApiError) return error.message;
  if (!isProductionRuntime() && error instanceof Error) return error.message;
  return fallbackAr;
}
