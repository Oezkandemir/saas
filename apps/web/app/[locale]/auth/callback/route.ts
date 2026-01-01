import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

import { getSupabaseServer } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");
  const userId = requestUrl.searchParams.get("id");

  // Get the locale from the URL or use default
  const locale =
    requestUrl.pathname.match(/^\/(en|de)(?:\/|$)/)?.[1] ||
    routing.defaultLocale;

  const supabase = await getSupabaseServer();

  // Handle standard OAuth or magic link callback with code
  if (code) {
    // Exchange code for session
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        logger.error("Error exchanging code for session", { message: error.message });
        return NextResponse.redirect(
          new URL(
            `/${locale}/login?error=${encodeURIComponent(error.message)}`,
            requestUrl.origin,
          ),
        );
      }

      // Create login session and log to history
      if (data.session && data.user) {
        const { createLoginSession } = await import("@/lib/session-tracking");
        const expiresAt = new Date(data.session.expires_at! * 1000);
        await createLoginSession(
          data.user.id,
          data.session.access_token,
          expiresAt,
        );
      }

      // Redirect to dashboard after successful authentication
      return NextResponse.redirect(
        new URL(`/${locale}/dashboard`, requestUrl.origin),
      );
    } catch (error) {
      logger.error("Unexpected error during auth callback", error);
      return NextResponse.redirect(
        new URL(
          `/${locale}/login?error=${encodeURIComponent("Authentication failed")}`,
          requestUrl.origin,
        ),
      );
    }
  }

  // Handle custom signup callback with user ID
  if (type === "signup" && userId) {
    try {
      // Call our API to confirm the user
      const confirmResponse = await fetch(
        `${requestUrl.origin}/api/confirm-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        },
      );

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json();
        logger.error("Failed to confirm user", errorData);
        throw new Error(errorData.error || "Failed to confirm user");
      }

      logger.info(`Email verified successfully for user ${userId}`);

      // Redirect to the verified page with the userId to enable client-side login
      return NextResponse.redirect(
        new URL(`/${locale}/auth/verified?userId=${userId}`, requestUrl.origin),
      );
    } catch (error) {
      logger.error("Error handling signup callback", error);
      return NextResponse.redirect(
        new URL(
          `/${locale}/login?error=${encodeURIComponent("Verification failed")}`,
          requestUrl.origin,
        ),
      );
    }
  }

  // If no code or other valid parameters, redirect to sign-in page
  return NextResponse.redirect(new URL(`/${locale}/login`, requestUrl.origin));
}
