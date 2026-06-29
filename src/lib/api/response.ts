import { NextResponse } from "next/server";
import { ApiError, sanitizeErrorMessage } from "@/lib/errors/api-error";

export type ApiSuccess<T> = {
  success: true;
  data: T;
  message: string;
};

export type ApiFailure = {
  success: false;
  error: string;
  code: number;
};

/**
 * Standard success JSON response for API routes.
 */
export function apiSuccess<T>(
  data: T,
  message = "Success",
  status = 200
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data, message }, { status });
}

/**
 * Standard error JSON response for API routes.
 */
export function apiError(
  error: string,
  code = 400
): NextResponse<ApiFailure> {
  return NextResponse.json({ success: false, error, code }, { status: code });
}

/**
 * Converts thrown errors into consistent API responses.
 */
export function handleApiError(error: unknown): NextResponse<ApiFailure> {
  if (error instanceof ApiError) {
    return apiError(error.message, error.statusCode);
  }

  if (process.env.NODE_ENV === "development") {
    console.error("[API Error]", error);
  }

  return apiError(sanitizeErrorMessage(error), 500);
}
