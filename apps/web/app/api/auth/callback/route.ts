import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { createLoginSession } from "@/lib/session-tracking";
import { getSupabaseRouteHandlerClient } from "@/lib/supabase-route-handler";

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") || "/dashboard";

    if (code) {
      const supabase = await getSupabaseRouteHandlerClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data.session && data.user) {
        // Create login session and log to history
        const expiresAt = new Date(data.session.expires_at! * 1000);
        await createLoginSession(data.user.id, expiresAt);
      }
    }

    // Redirect to the dashboard (or the next URL if provided)
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  } catch (error) {
    logger.error("Error in auth callback:", error);
    return NextResponse.redirect(
      new URL("/login?error=callback_error", request.url),
    );
  }
}
