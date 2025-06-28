import { NextRequest, NextResponse } from "next/server";

import { getSupabaseRouteHandlerClient } from "@/lib/supabase-route-handler";

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") || "/dashboard";

    if (code) {
      const supabase = await getSupabaseRouteHandlerClient();
      await supabase.auth.exchangeCodeForSession(code);
    }

    // Redirect to the dashboard (or the next URL if provided)
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  } catch (error) {
    console.error("Error in auth callback:", error);
    return NextResponse.redirect(
      new URL("/login?error=callback_error", request.url),
    );
  }
}
