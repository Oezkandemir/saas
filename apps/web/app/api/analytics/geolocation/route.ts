import { unstable_cache } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { CACHE_CONFIG } from "@/config/constants";
import { addCacheHeaders, checkETag, generateETag } from "@/lib/api-cache";
import { applyAPIMiddleware } from "@/lib/api-middleware";
import { logger } from "@/lib/logger";

/**
 * Server-side geolocation API route
 * Fetches geolocation data from IP address to avoid CSP issues
 * Fails gracefully with default values if service is unavailable
 */
export async function GET(request: NextRequest) {
  // SECURITY: Apply rate limiting
  const middleware = await applyAPIMiddleware(request, {
    rateLimit: {
      endpoint: "/api/analytics/geolocation",
      useUserBasedLimit: false,
    },
  });

  if (!middleware.valid) {
    return middleware.response;
  }
  // Default response - return immediately if geolocation fails
  const defaultResponse = {
    country: null,
    city: null,
    region: null,
    timezone: null,
    latitude: null,
    longitude: null,
  };

  // Internal function to fetch geolocation
  async function _fetchGeolocation(ip: string, userAgent: string) {
    const url = ip ? `https://ipapi.co/${ip}/json/` : "https://ipapi.co/json/";

    // Create abort controller for better timeout handling
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      // Set timeout to abort request after 3 seconds
      timeoutId = setTimeout(() => {
        try {
          controller.abort();
        } catch (_err) {
          // Ignore abort errors
        }
      }, 3000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": userAgent || "Mozilla/5.0",
        },
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (!response.ok) {
        return defaultResponse;
      }

      // Check content type before parsing JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        return defaultResponse;
      }

      // Try to parse JSON with error handling
      let data;
      try {
        const text = await response.text();
        const trimmedText = text.trim();
        try {
          data = JSON.parse(trimmedText);
        } catch {
          const jsonMatch = trimmedText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            data = JSON.parse(jsonMatch[0]);
          } else {
            return defaultResponse;
          }
        }
      } catch (_parseError) {
        return defaultResponse;
      }

      return {
        country: data.country_name || null,
        city: data.city || null,
        region: data.region || null,
        timezone: data.timezone || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
      };
    } catch (fetchError: any) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (
        fetchError?.name === "AbortError" ||
        fetchError?.code === 23 ||
        fetchError?.message?.includes("aborted")
      ) {
        return defaultResponse;
      }

      throw fetchError;
    }
  }

  // Get client IP and user-agent from headers BEFORE caching
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp?.trim() || "";
  const userAgent = request.headers.get("user-agent") || "Mozilla/5.0";

  // If no IP found, use empty string to get current request IP
  const ipToUse = ip || "";

  // Cached version of geolocation fetch
  const getCachedGeolocation = unstable_cache(
    async (ip: string, userAgent: string) => {
      return _fetchGeolocation(ip, userAgent);
    },
    ["analytics-geolocation"],
    {
      revalidate: CACHE_CONFIG.api.geolocation.revalidate,
      tags: ["analytics-geolocation"],
    }
  );

  try {
    // Fetch cached geolocation data
    const data = await getCachedGeolocation(ipToUse, userAgent);
    const etag = generateETag(data);

    // Check ETag for 304 Not Modified
    const etagCheck = checkETag(request, etag);
    if (etagCheck) {
      return etagCheck;
    }

    // Return response with cache headers
    const response = NextResponse.json(data);
    return addCacheHeaders(response, {
      maxAge: CACHE_CONFIG.api.geolocation.revalidate,
      staleWhileRevalidate: 600, // 10 minutes stale-while-revalidate
      etag,
    });
  } catch (error: any) {
    // Only log critical errors, not timeouts or expected failures
    if (
      error?.name !== "AbortError" &&
      error?.code !== 23 &&
      !error?.message?.includes("aborted")
    ) {
      // Log only critical unexpected errors
      logger.error("Geolocation API error:", error?.message || error);
    }

    // Return default values on any error with no-cache header
    const response = NextResponse.json(defaultResponse);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}
