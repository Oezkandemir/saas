import {
  getAnalyticsData,
  getDetailedAnalytics,
  recordPageView,
  trackUserInteraction,
  type PageViewData,
  type UserInteractionData,
} from "@/actions/analytics-actions";
import { describe, expect, test, vi } from "vitest";

// Mock the supabaseAdmin and currentUser
vi.mock("@/lib/db", () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              data: [],
              error: null,
            })),
          })),
        })),
        not: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              data: [],
              error: null,
            })),
          })),
        })),
        in: vi.fn(() => ({
          data: [],
          error: null,
        })),
        data: [],
        error: null,
      })),
    })),
    rpc: vi.fn(() => ({
      data: { mock: "analytics data" },
      error: null,
    })),
  },
}));

vi.mock("@/lib/session", () => ({
  getCurrentUser: vi.fn(() => ({
    id: "test-user-id",
    role: "ADMIN",
  })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        data: null,
        error: null,
      })),
    })),
  })),
}));

describe("Analytics Actions", () => {
  test("getAnalyticsData should return analytics data for admin users", async () => {
    const result = await getAnalyticsData();
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  test("getDetailedAnalytics should return detailed analytics for admin users", async () => {
    const result = await getDetailedAnalytics(30);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  test("recordPageView should record a page view", async () => {
    const pageViewData: PageViewData = {
      userId: "test-user-id",
      sessionId: "test-session-id",
      pagePath: "/test-page",
      pageTitle: "Test Page",
      browser: "Chrome",
      os: "Windows",
      deviceType: "Desktop",
      screenSize: "1920x1080",
    };

    const result = await recordPageView(pageViewData);
    expect(result.success).toBe(true);
  });

  test("trackUserInteraction should record a user interaction", async () => {
    const interactionData: UserInteractionData = {
      userId: "test-user-id",
      sessionId: "test-session-id",
      pagePath: "/test-page",
      interactionType: "click",
      elementId: "test-button",
      elementText: "Click Me",
    };

    const result = await trackUserInteraction(interactionData);
    expect(result.success).toBe(true);
  });
});
