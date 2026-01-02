import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { applyAPIMiddleware } from "@/lib/api-middleware";
import { getCurrentUser } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";

// Mock dependencies
vi.mock("@/lib/session");
vi.mock("@/lib/rate-limit");

describe("API Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("applyAPIMiddleware", () => {
    it("should return valid if no options provided", async () => {
      const request = new NextRequest("http://localhost/api/test");
      const result = await applyAPIMiddleware(request);
      expect(result.valid).toBe(true);
    });

    it("should return invalid if requireAuth is true and user is not authenticated", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);
      const request = new NextRequest("http://localhost/api/test");
      const result = await applyAPIMiddleware(request, {
        requireAuth: true,
      });
      expect(result.valid).toBe(false);
      expect(result.response.status).toBe(401);
    });

    it("should return valid if requireAuth is true and user is authenticated", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "user-123",
        role: "USER",
        email: "test@example.com",
      } as any);
      const request = new NextRequest("http://localhost/api/test");
      const result = await applyAPIMiddleware(request, {
        requireAuth: true,
      });
      expect(result.valid).toBe(true);
      expect(result.user).toBeDefined();
    });

    it("should return invalid if requireAdmin is true and user is not admin", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "user-123",
        role: "USER",
        email: "test@example.com",
      } as any);
      const request = new NextRequest("http://localhost/api/test");
      const result = await applyAPIMiddleware(request, {
        requireAdmin: true,
      });
      expect(result.valid).toBe(false);
      expect(result.response.status).toBe(403);
    });

    it("should return valid if requireAdmin is true and user is admin", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "admin-123",
        role: "ADMIN",
        email: "admin@example.com",
      } as any);
      const request = new NextRequest("http://localhost/api/test");
      const result = await applyAPIMiddleware(request, {
        requireAdmin: true,
      });
      expect(result.valid).toBe(true);
      expect(result.user?.role).toBe("ADMIN");
    });

    it("should return invalid if rate limit is exceeded", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "user-123",
        role: "USER",
        email: "test@example.com",
      } as any);
      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + 60000),
        blocked: false,
      });
      const request = new NextRequest("http://localhost/api/test");
      const result = await applyAPIMiddleware(request, {
        rateLimit: {
          endpoint: "/api/test",
          useUserBasedLimit: true,
        },
      });
      expect(result.valid).toBe(false);
      expect(result.response.status).toBe(429);
    });

    it("should return valid if rate limit is not exceeded", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "user-123",
        role: "USER",
        email: "test@example.com",
      } as any);
      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 10,
        resetAt: new Date(Date.now() + 60000),
        blocked: false,
      });
      const request = new NextRequest("http://localhost/api/test");
      const result = await applyAPIMiddleware(request, {
        rateLimit: {
          endpoint: "/api/test",
          useUserBasedLimit: true,
        },
      });
      expect(result.valid).toBe(true);
    });

    it("should combine auth and rate limiting checks", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "user-123",
        role: "USER",
        email: "test@example.com",
      } as any);
      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 10,
        resetAt: new Date(Date.now() + 60000),
        blocked: false,
      });
      const request = new NextRequest("http://localhost/api/test");
      const result = await applyAPIMiddleware(request, {
        requireAuth: true,
        rateLimit: {
          endpoint: "/api/test",
          useUserBasedLimit: true,
        },
      });
      expect(result.valid).toBe(true);
      expect(result.user).toBeDefined();
    });
  });
});

