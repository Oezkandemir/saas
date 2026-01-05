import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { logger } from "./logger";

/**
 * Standardized error response format
 */
export interface ErrorResponse {
  error: string;
  message?: string;
  details?: unknown;
  code?: string;
}

/**
 * Error types for better error handling
 */
export enum ErrorType {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
  NOT_FOUND_ERROR = "NOT_FOUND_ERROR",
  RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

/**
 * Handle errors and return standardized responses
 */
export function handleAPIError(
  error: unknown,
  options: {
    defaultMessage?: string;
    logError?: boolean;
    includeDetails?: boolean;
  } = {},
): NextResponse<ErrorResponse> {
  const {
    defaultMessage = "An error occurred",
    logError = true,
    includeDetails = process.env.NODE_ENV === "development",
  } = options;

  // Log error if requested
  if (logError) {
    logger.error("API error occurred", error);
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: ErrorType.VALIDATION_ERROR,
        message: "Validation failed",
        details: includeDetails
          ? error.errors.map((e) => ({
              path: e.path.join("."),
              message: e.message,
            }))
          : undefined,
      },
      { status: 400 },
    );
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // Don't expose internal error details in production
    const message =
      includeDetails || error.message.startsWith("User")
        ? error.message
        : defaultMessage;

    return NextResponse.json(
      {
        error: ErrorType.INTERNAL_ERROR,
        message,
        details: includeDetails
          ? {
              name: error.name,
              stack: error.stack,
            }
          : undefined,
      },
      { status: 500 },
    );
  }

  // Handle string errors
  if (typeof error === "string") {
    return NextResponse.json(
      {
        error: ErrorType.INTERNAL_ERROR,
        message: includeDetails ? error : defaultMessage,
      },
      { status: 500 },
    );
  }

  // Handle unknown error types
  return NextResponse.json(
    {
      error: ErrorType.INTERNAL_ERROR,
      message: defaultMessage,
      details: includeDetails ? error : undefined,
    },
    { status: 500 },
  );
}

/**
 * Create standardized success response
 */
export function successResponse<T>(
  data: T,
  status: number = 200,
): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * Create standardized error response
 */
export function errorResponse(
  error: ErrorType | string,
  message: string,
  status: number = 500,
  details?: unknown,
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: typeof error === "string" ? error : error,
      message,
      details: process.env.NODE_ENV === "development" ? details : undefined,
    },
    { status },
  );
}
