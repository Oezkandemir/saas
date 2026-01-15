import { unstable_cache } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { CACHE_CONFIG } from "@/config/constants";
import { addCacheHeaders, checkETag, generateETag } from "@/lib/api-cache";
import { applyAPIMiddleware } from "@/lib/api-middleware";
import { logger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabase/admin";

// POST handler to increment page views
export async function POST(request: NextRequest) {
  // SECURITY: Apply rate limiting
  const middleware = await applyAPIMiddleware(request, {
    rateLimit: {
      endpoint: "/api/views",
      useUserBasedLimit: false,
    },
  });

  if (!middleware.valid) {
    return middleware.response;
  }
  try {
    const { slug } = await request.json();

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    // Normalize the slug to prevent duplicates
    const normalizedSlug = slug.trim().toLowerCase();

    // Call the increment_page_view stored procedure
    await supabaseAdmin.rpc("increment_page_view", {
      page_path_param: normalizedSlug,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error incrementing page view:", error);
    return NextResponse.json(
      { error: "Failed to increment page view" },
      { status: 500 }
    );
  }
}

/**
 * Internal function to fetch page view count
 */
async function _getPageViewCount(slug: string): Promise<number> {
  // Query the view count using the stored function
  const { data, error } = await supabaseAdmin.rpc("get_page_view_count", {
    page_path_param: slug,
  });

  if (error) {
    throw error;
  }

  return data && data.length > 0 ? data[0].view_count : 0;
}

/**
 * Cached version of page view count
 */
const getCachedPageViewCount = unstable_cache(
  async (slug: string) => {
    return _getPageViewCount(slug);
  },
  ["page-view-count"],
  {
    revalidate: CACHE_CONFIG.api.pageViews.revalidate,
    tags: ["page-view-count"],
  }
);

// GET handler to fetch page views for a specific slug
export async function GET(request: NextRequest) {
  // SECURITY: Apply rate limiting
  const middleware = await applyAPIMiddleware(request, {
    rateLimit: {
      endpoint: "/api/views",
      useUserBasedLimit: false,
    },
  });

  if (!middleware.valid) {
    return middleware.response;
  }
  try {
    // Get the slug from the URL params
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    // Normalize the slug
    const normalizedSlug = slug.trim().toLowerCase();

    // Fetch cached view count
    const views = await getCachedPageViewCount(normalizedSlug);
    const data = { views };
    const etag = generateETag(data);

    // Check ETag for 304 Not Modified
    const etagCheck = checkETag(request, etag);
    if (etagCheck) {
      return etagCheck;
    }

    // Return response with cache headers
    const response = NextResponse.json(data);
    return addCacheHeaders(response, {
      maxAge: CACHE_CONFIG.api.pageViews.revalidate,
      staleWhileRevalidate: 300,
      etag,
    });
  } catch (error) {
    logger.error("Error fetching page views:", error);
    return NextResponse.json(
      { error: "Failed to fetch page views" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
