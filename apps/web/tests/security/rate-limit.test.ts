import { headers } from "next/headers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { checkRateLimit, getRateLimitConfig } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

// Mock dependencies
vi.mock("next/headers");
vi.mock("@/lib/session");
vi.mock("@/lib/supabase/server");

describe("Rate Limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getRateLimitConfig", () => {
    it("should return default config if no config found", async () => {
      vi.mocked(createClient).mockResolvedValue({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: null })),
              })),
            })),
            like: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: null })),
            })),
          })),
        })),
      } as any);

      const config = await getRateLimitConfig("/api/test");
      expect(config.endpoint).toBe("/api/test");
      expect(config.maxRequests).toBe(100);
      expect(config.windowSeconds).toBe(60);
      expect(config.enabled).toBe(true);
    });

    it("should return config from database if found", async () => {
      vi.mocked(createClient).mockResolvedValue({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      endpoint: "/api/test",
                      max_requests: 50,
                      window_seconds: 30,
                      block_duration_seconds: 300,
                      enabled: true,
                    },
                  })
                ),
              })),
            })),
          })),
        })),
      } as any);

      const config = await getRateLimitConfig("/api/test");
      expect(config.maxRequests).toBe(50);
      expect(config.windowSeconds).toBe(30);
    });
  });

  describe("checkRateLimit", () => {
    it("should return allowed if rate limiting is disabled", async () => {
      vi.mocked(getRateLimitConfig).mockResolvedValue({
        endpoint: "/api/test",
        maxRequests: 100,
        windowSeconds: 60,
        blockDurationSeconds: 300,
        enabled: false,
      });

      const result = await checkRateLimit("/api/test");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(Infinity);
    });

    it("should use IP address when identifierType is ip", async () => {
      vi.mocked(getRateLimitConfig).mockResolvedValue({
        endpoint: "/api/test",
        maxRequests: 100,
        windowSeconds: 60,
        blockDurationSeconds: 300,
        enabled: true,
      });

      vi.mocked(headers).mockResolvedValue({
        get: vi.fn((name: string) => {
          if (name === "x-forwarded-for") return "192.168.1.1";
          return null;
        }),
      } as any);

      vi.mocked(createClient).mockResolvedValue({
        rpc: vi.fn(() =>
          Promise.resolve({
            data: [
              {
                allowed: true,
                remaining: 99,
                reset_at: new Date(Date.now() + 60000).toISOString(),
                blocked: false,
              },
            ],
            error: null,
          })
        ),
      } as any);

      const result = await checkRateLimit("/api/test", undefined, "ip");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99);
    });

    it("should use user ID when identifierType is user", async () => {
      vi.mocked(getRateLimitConfig).mockResolvedValue({
        endpoint: "/api/test",
        maxRequests: 100,
        windowSeconds: 60,
        blockDurationSeconds: 300,
        enabled: true,
      });

      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "user-123",
        role: "USER",
        email: "test@example.com",
      } as any);

      vi.mocked(createClient).mockResolvedValue({
        rpc: vi.fn(() =>
          Promise.resolve({
            data: [
              {
                allowed: true,
                remaining: 50,
                reset_at: new Date(Date.now() + 60000).toISOString(),
                blocked: false,
              },
            ],
            error: null,
          })
        ),
      } as any);

      const result = await checkRateLimit("/api/test", undefined, "user");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(50);
    });

    it("should return not allowed if rate limit exceeded", async () => {
      vi.mocked(getRateLimitConfig).mockResolvedValue({
        endpoint: "/api/test",
        maxRequests: 100,
        windowSeconds: 60,
        blockDurationSeconds: 300,
        enabled: true,
      });

      vi.mocked(headers).mockResolvedValue({
        get: vi.fn(() => "192.168.1.1"),
      } as any);

      vi.mocked(createClient).mockResolvedValue({
        rpc: vi.fn(() =>
          Promise.resolve({
            data: [
              {
                allowed: false,
                remaining: 0,
                reset_at: new Date(Date.now() + 60000).toISOString(),
                blocked: false,
              },
            ],
            error: null,
          })
        ),
      } as any);

      const result = await checkRateLimit("/api/test");
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should fail open if rate limit check fails", async () => {
      vi.mocked(getRateLimitConfig).mockResolvedValue({
        endpoint: "/api/test",
        maxRequests: 100,
        windowSeconds: 60,
        blockDurationSeconds: 300,
        enabled: true,
      });

      vi.mocked(headers).mockResolvedValue({
        get: vi.fn(() => "192.168.1.1"),
      } as any);

      vi.mocked(createClient).mockResolvedValue({
        rpc: vi.fn(() =>
          Promise.resolve({
            data: null,
            error: { message: "Database error" },
          })
        ),
      } as any);

      const result = await checkRateLimit("/api/test");
      // Should fail open (allow request)
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(Infinity);
    });
  });
});
