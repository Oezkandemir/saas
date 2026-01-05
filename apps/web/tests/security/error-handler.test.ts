import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

import {
  errorResponse,
  ErrorType,
  handleAPIError,
  successResponse,
} from "@/lib/error-handler";

describe("Error Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("handleAPIError", () => {
    it("should handle Zod validation errors", () => {
      const zodError = new ZodError([
        {
          code: "invalid_type",
          expected: "string",
          received: "number",
          path: ["email"],
          message: "Expected string, received number",
        },
      ]);

      const result = handleAPIError(zodError, {
        logError: false,
        includeDetails: true,
      });

      expect(result.status).toBe(400);
      const json = JSON.parse(result.body as string);
      expect(json.error).toBe(ErrorType.VALIDATION_ERROR);
      expect(json.details).toBeDefined();
    });

    it("should handle standard Error objects", () => {
      const error = new Error("Test error");
      const result = handleAPIError(error, {
        logError: false,
        includeDetails: true,
      });

      expect(result.status).toBe(500);
      const json = JSON.parse(result.body as string);
      expect(json.error).toBe(ErrorType.INTERNAL_ERROR);
      expect(json.message).toBe("Test error");
    });

    it("should not expose error details in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const error = new Error("Internal server error");
      const result = handleAPIError(error, {
        defaultMessage: "An error occurred",
        logError: false,
        includeDetails: false,
      });

      const json = JSON.parse(result.body as string);
      expect(json.message).toBe("An error occurred");
      expect(json.details).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });

    it("should handle string errors", () => {
      const result = handleAPIError("String error", {
        logError: false,
        includeDetails: true,
      });

      expect(result.status).toBe(500);
      const json = JSON.parse(result.body as string);
      expect(json.error).toBe(ErrorType.INTERNAL_ERROR);
      expect(json.message).toBe("String error");
    });

    it("should handle unknown error types", () => {
      const result = handleAPIError(
        { unknown: "error" },
        {
          defaultMessage: "Default error",
          logError: false,
          includeDetails: true,
        },
      );

      expect(result.status).toBe(500);
      const json = JSON.parse(result.body as string);
      expect(json.error).toBe(ErrorType.INTERNAL_ERROR);
      expect(json.message).toBe("Default error");
    });
  });

  describe("successResponse", () => {
    it("should create a success response with default status", () => {
      const data = { message: "Success" };
      const result = successResponse(data);
      expect(result.status).toBe(200);
      const json = JSON.parse(result.body as string);
      expect(json.message).toBe("Success");
    });

    it("should create a success response with custom status", () => {
      const data = { message: "Created" };
      const result = successResponse(data, 201);
      expect(result.status).toBe(201);
    });
  });

  describe("errorResponse", () => {
    it("should create an error response", () => {
      const result = errorResponse(
        ErrorType.AUTHENTICATION_ERROR,
        "Not authenticated",
        401,
      );
      expect(result.status).toBe(401);
      const json = JSON.parse(result.body as string);
      expect(json.error).toBe(ErrorType.AUTHENTICATION_ERROR);
      expect(json.message).toBe("Not authenticated");
    });

    it("should include details in development", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const result = errorResponse(
        ErrorType.VALIDATION_ERROR,
        "Validation failed",
        400,
        { field: "email" },
      );
      const json = JSON.parse(result.body as string);
      expect(json.details).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });

    it("should not include details in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const result = errorResponse(
        ErrorType.VALIDATION_ERROR,
        "Validation failed",
        400,
        { field: "email" },
      );
      const json = JSON.parse(result.body as string);
      expect(json.details).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });
  });
});
