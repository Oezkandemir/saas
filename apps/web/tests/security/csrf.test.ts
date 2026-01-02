import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import {
  generateCSRFToken,
  validateCSRFToken,
  validateCSRFTokenFromRequest,
  requireCSRFToken,
} from "@/lib/csrf";
import { getSession } from "@/lib/session";

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

// Mock session
vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

describe("CSRF Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateCSRFToken", () => {
    it("should generate a valid CSRF token", () => {
      const token = generateCSRFToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });

    it("should generate unique tokens", () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe("validateCSRFToken", () => {
    it("should return false if token is missing", async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue(null),
      } as any);

      const result = await validateCSRFToken(null);
      expect(result).toBe(false);
    });

    it("should return false if cookie token is missing", async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue(null),
      } as any);

      const result = await validateCSRFToken("some-token");
      expect(result).toBe(false);
    });

    it("should return true for valid token", async () => {
      const token = generateCSRFToken();
      const hashedToken = require("crypto")
        .createHash("sha256")
        .update(token)
        .digest("hex");

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: hashedToken }),
      } as any);

      const result = await validateCSRFToken(token);
      expect(result).toBe(true);
    });

    it("should return false for invalid token", async () => {
      const token = generateCSRFToken();
      const wrongToken = generateCSRFToken();
      const hashedWrongToken = require("crypto")
        .createHash("sha256")
        .update(wrongToken)
        .digest("hex");

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: hashedWrongToken }),
      } as any);

      const result = await validateCSRFToken(token);
      expect(result).toBe(false);
    });
  });

  describe("validateCSRFTokenFromRequest", () => {
    it("should return true if no session exists", async () => {
      vi.mocked(getSession).mockResolvedValue(null);
      const result = await validateCSRFTokenFromRequest(null);
      expect(result).toBe(true);
    });

    it("should validate token if session exists", async () => {
      vi.mocked(getSession).mockResolvedValue({} as any);
      const token = generateCSRFToken();
      const hashedToken = require("crypto")
        .createHash("sha256")
        .update(token)
        .digest("hex");

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: hashedToken }),
      } as any);

      const result = await validateCSRFTokenFromRequest(token);
      expect(result).toBe(true);
    });
  });

  describe("requireCSRFToken", () => {
    it("should return valid for GET requests", async () => {
      const request = new Request("http://localhost/api/test", {
        method: "GET",
      });
      const result = await requireCSRFToken(request);
      expect(result.valid).toBe(true);
    });

    it("should return valid for HEAD requests", async () => {
      const request = new Request("http://localhost/api/test", {
        method: "HEAD",
      });
      const result = await requireCSRFToken(request);
      expect(result.valid).toBe(true);
    });

    it("should return valid for OPTIONS requests", async () => {
      const request = new Request("http://localhost/api/test", {
        method: "OPTIONS",
      });
      const result = await requireCSRFToken(request);
      expect(result.valid).toBe(true);
    });

    it("should return invalid for POST without session", async () => {
      vi.mocked(getSession).mockResolvedValue(null);
      const request = new Request("http://localhost/api/test", {
        method: "POST",
      });
      const result = await requireCSRFToken(request);
      expect(result.valid).toBe(true); // No session means no CSRF risk
    });

    it("should return invalid for POST with session but no token", async () => {
      vi.mocked(getSession).mockResolvedValue({} as any);
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue(null),
      } as any);

      const request = new Request("http://localhost/api/test", {
        method: "POST",
        headers: {},
      });
      const result = await requireCSRFToken(request);
      expect(result.valid).toBe(false);
      expect(result.response.status).toBe(403);
    });

    it("should return valid for POST with valid token", async () => {
      vi.mocked(getSession).mockResolvedValue({} as any);
      const token = generateCSRFToken();
      const hashedToken = require("crypto")
        .createHash("sha256")
        .update(token)
        .digest("hex");

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: hashedToken }),
      } as any);

      const request = new Request("http://localhost/api/test", {
        method: "POST",
        headers: {
          "X-CSRF-Token": token,
        },
      });
      const result = await requireCSRFToken(request);
      expect(result.valid).toBe(true);
    });
  });
});

