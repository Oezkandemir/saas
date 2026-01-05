import { NextRequest, NextResponse } from "next/server";

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

  try {
    // Get client IP from headers
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ip = forwarded?.split(",")[0]?.trim() || realIp?.trim() || "";

    // If no IP found, use empty string to get current request IP
    const ipToUse = ip || "";

    // Use free IP geolocation service with shorter timeout
    const url = ipToUse
      ? `https://ipapi.co/${ipToUse}/json/`
      : "https://ipapi.co/json/";

    // Create abort controller for better timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": request.headers.get("user-agent") || "Mozilla/5.0",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Return default values if API fails
        return NextResponse.json(defaultResponse);
      }

      const data = await response.json();

      return NextResponse.json({
        country: data.country_name || null,
        city: data.city || null,
        region: data.region || null,
        timezone: data.timezone || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      // Don't log timeout errors - they're expected and handled gracefully
      if (fetchError?.name === "AbortError" || fetchError?.code === 23) {
        // Timeout - return defaults silently
        return NextResponse.json(defaultResponse);
      }

      // Re-throw other errors to be caught by outer catch
      throw fetchError;
    }
  } catch (error: any) {
    // Only log unexpected errors, not timeouts or expected failures
    if (error?.name !== "AbortError" && error?.code !== 23) {
      // Log only unexpected errors
      logger.debug("Geolocation API error:", error?.message || error);
    }

    // Return default values on any error
    return NextResponse.json(defaultResponse);
  }
}
