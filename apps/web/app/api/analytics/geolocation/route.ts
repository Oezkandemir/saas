import { type NextRequest, NextResponse } from "next/server";

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
          "User-Agent": request.headers.get("user-agent") || "Mozilla/5.0",
        },
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (!response.ok) {
        // Return default values if API fails
        return NextResponse.json(defaultResponse);
      }

      // Check content type before parsing JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        // Not JSON response - return defaults
        return NextResponse.json(defaultResponse);
      }

      // Try to parse JSON with error handling
      let data;
      try {
        const text = await response.text();
        // Trim whitespace and try to parse JSON
        const trimmedText = text.trim();
        // Try direct parse first
        try {
          data = JSON.parse(trimmedText);
        } catch {
          // If direct parse fails, try to extract JSON object
          const jsonMatch = trimmedText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            data = JSON.parse(jsonMatch[0]);
          } else {
            // No valid JSON found - return defaults
            return NextResponse.json(defaultResponse);
          }
        }
      } catch (_parseError) {
        // JSON parse failed - return defaults silently
        return NextResponse.json(defaultResponse);
      }

      return NextResponse.json({
        country: data.country_name || null,
        city: data.city || null,
        region: data.region || null,
        timezone: data.timezone || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
      });
    } catch (fetchError: any) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // Don't log timeout errors - they're expected and handled gracefully
      if (
        fetchError?.name === "AbortError" ||
        fetchError?.code === 23 ||
        fetchError?.message?.includes("aborted")
      ) {
        // Timeout - return defaults silently
        return NextResponse.json(defaultResponse);
      }

      // Re-throw other errors to be caught by outer catch
      throw fetchError;
    }
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

    // Return default values on any error
    return NextResponse.json(defaultResponse);
  }
}
