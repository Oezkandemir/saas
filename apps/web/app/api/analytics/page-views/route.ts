import { type NextRequest, NextResponse } from "next/server";

import { applyAPIMiddleware } from "@/lib/api-middleware";
import { logger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET handler to fetch the most viewed pages
 *
 * @param request - The incoming request
 * @returns JSON response with page view analytics
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Apply middleware (rate limiting)
    const middleware = await applyAPIMiddleware(request, {
      rateLimit: {
        endpoint: "/api/analytics/page-views",
        useUserBasedLimit: false,
      },
    });

    if (!middleware.valid) {
      return middleware.response;
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "5", 10);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);

    // Validate limit (max 100)
    const validLimit = Math.min(Math.max(1, limit), 100);
    const validOffset = Math.max(0, offset);

    // Fetch the most viewed pages using direct SQL
    const { data: pages, error: pagesError } = await supabaseAdmin
      .from("page_views")
      .select("page_path, created_at")
      .order("created_at", { ascending: false })
      .range(validOffset, validOffset + validLimit - 1);

    if (pagesError) {
      throw pagesError;
    }

    // Process results to get view counts by page
    const pageViews = pages || [];
    const viewCountMap = new Map();

    for (const view of pageViews) {
      const path = view.page_path;
      if (!viewCountMap.has(path)) {
        viewCountMap.set(path, {
          slug: path,
          view_count: 1,
          created_at: view.created_at,
          updated_at: view.created_at,
        });
      } else {
        const existing = viewCountMap.get(path);
        existing.view_count += 1;

        // Update created_at if this view is older
        if (new Date(view.created_at) < new Date(existing.created_at)) {
          existing.created_at = view.created_at;
        }

        // Update updated_at if this view is newer
        if (new Date(view.created_at) > new Date(existing.updated_at)) {
          existing.updated_at = view.created_at;
        }
      }
    }

    // Convert to array and sort by view count
    const processedPages = Array.from(viewCountMap.values()).sort(
      (a, b) => b.view_count - a.view_count
    );

    // Get total count of page views
    const { count: totalViews, error: countError } = await supabaseAdmin
      .from("page_views")
      .select("*", { count: "exact", head: true });

    if (countError) {
      throw countError;
    }

    // Count unique pages by fetching all page paths
    const { data: uniquePathsData, error: uniqueError } = await supabaseAdmin
      .from("page_views")
      .select("page_path")
      .limit(1000); // Reasonable limit to prevent huge queries

    if (uniqueError) {
      throw uniqueError;
    }

    // Count unique page paths
    const uniquePaths = new Set();
    (uniquePathsData || []).forEach((item) => {
      if (item.page_path) {
        uniquePaths.add(item.page_path);
      }
    });

    return NextResponse.json({
      pages: processedPages,
      total: totalViews || 0,
      pageCount: uniquePaths.size,
    });
  } catch (error) {
    logger.error("Error fetching page views:", error);
    return NextResponse.json(
      { error: "Failed to fetch page views analytics" },
      { status: 500 }
    );
  }
}
