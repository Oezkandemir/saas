import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { routing } from "@/i18n/routing";
import { logger } from "@/lib/logger";
import { applyAPIMiddleware } from "@/lib/api-middleware";

export async function POST(request: NextRequest) {
  // SECURITY: Apply rate limiting
  const middleware = await applyAPIMiddleware(request, {
    rateLimit: {
      endpoint: "/api/locale",
      useUserBasedLimit: false,
    },
  });

  if (!middleware.valid) {
    return middleware.response;
  }
  try {
    const { locale } = await request.json();

    // Validate locale
    if (!locale || !routing.locales.includes(locale)) {
      return NextResponse.json(
        { error: "Invalid locale" },
        { status: 400 },
      );
    }

    // Save locale preference to cookie (expires in 1 year)
    const cookieStore = await cookies();
    cookieStore.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
      httpOnly: false, // Allow client-side access if needed
    });

    return NextResponse.json({ success: true, locale });
  } catch (error) {
    logger.error("Error saving locale preference:", error);
    return NextResponse.json(
      { error: "Failed to save locale preference" },
      { status: 500 },
    );
  }
}

















