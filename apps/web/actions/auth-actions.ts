"use server";

import { logger } from "@/lib/logger";
import { createLoginSession } from "@/lib/session-tracking";
import { createClient } from "@/lib/supabase/server";

/**
 * Track login session after successful client-side login
 * @param sessionToken Session access token
 * @param expiresAt Session expiration timestamp
 */
export async function trackLoginSession(
  _sessionToken: string,
  expiresAt: number,
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    const expiresAtDate = new Date(expiresAt * 1000);
    await createLoginSession(user.id, expiresAtDate);

    return { success: true };
  } catch (error) {
    logger.error("Error tracking login session:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to track session",
    };
  }
}
