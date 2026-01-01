import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side geolocation API route
 * Fetches geolocation data from IP address to avoid CSP issues
 */
export async function GET(request: NextRequest) {
  try {
    // Get client IP from headers
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ip = forwarded?.split(",")[0]?.trim() || realIp?.trim() || "";

    // If no IP found, use empty string to get current request IP
    const ipToUse = ip || "";

    // Use free IP geolocation service
    const url = ipToUse ? `https://ipapi.co/${ipToUse}/json/` : "https://ipapi.co/json/";
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: {
        "User-Agent": request.headers.get("user-agent") || "Mozilla/5.0",
      },
    });

    if (!response.ok) {
      // Return default values if API fails
      return NextResponse.json({
        country: null,
        city: null,
        region: null,
        timezone: null,
        latitude: null,
        longitude: null,
      });
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
  } catch (error) {
    console.error("Error fetching geolocation:", error);
    // Return default values on error
    return NextResponse.json({
      country: null,
      city: null,
      region: null,
      timezone: null,
      latitude: null,
      longitude: null,
    });
  }
}

