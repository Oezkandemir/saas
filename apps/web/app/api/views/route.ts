import { type NextRequest, NextResponse } from "next/server";

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

    // Query the view count using the stored function
    const { data, error } = await supabaseAdmin.rpc("get_page_view_count", {
      page_path_param: normalizedSlug,
    });

    if (error) {
      throw error;
    }

    // Return the view count or 0 if not found
    return NextResponse.json({
      views: data && data.length > 0 ? data[0].view_count : 0,
    });
  } catch (error) {
    logger.error("Error fetching page views:", error);
    return NextResponse.json(
      { error: "Failed to fetch page views" },
      { status: 500 }
    );
  }
}
