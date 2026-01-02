"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { logger } from "@/lib/logger";

/**
 * Create a login session and log to history
 * @param userId User ID
 * @param sessionToken Session token from Supabase
 * @param expiresAt Session expiration time
 */
export async function createLoginSession(
  userId: string,
  sessionToken: string,
  expiresAt: Date,
): Promise<void> {
  try {
    const supabase = await createClient();
    const headersList = await headers();
    
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || null;
    const userAgent = headersList.get("user-agent") || null;

    // Extract device info from user agent (simplified)
    const deviceInfo = userAgent
      ? {
          userAgent,
          // Could be enhanced with device detection library
        }
      : null;

    // Mark all other sessions as not current
    await supabase
      .from("login_sessions")
      .update({ is_current: false })
      .eq("user_id", userId);

    // Create new session
    await supabase.from("login_sessions").insert({
      user_id: userId,
      session_token: sessionToken,
      ip_address: ipAddress,
      user_agent: userAgent,
      device_info: deviceInfo,
      is_current: true,
      expires_at: expiresAt.toISOString(),
    });

    // Log to login history
    await supabase.from("login_history").insert({
      user_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent,
      device_info: deviceInfo,
      success: true,
      two_factor_used: false, // Will be updated if 2FA is used
    });
  } catch (error) {
    logger.error("Error creating login session", error);
    // Don't throw - session tracking failures shouldn't break login
  }
}

/**
 * Update session activity timestamp
 * @param sessionToken Session token
 */
export async function updateSessionActivity(sessionToken: string): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase
      .from("login_sessions")
      .update({ last_activity: new Date().toISOString() })
      .eq("session_token", sessionToken)
      .gte("expires_at", new Date().toISOString());
  } catch (error) {
    logger.error("Error updating session activity", error);
  }
}

/**
 * Log failed login attempt
 * @param userId User ID (if known)
 * @param failureReason Reason for failure
 */
export async function logFailedLogin(
  userId: string | null,
  failureReason: string,
): Promise<void> {
  try {
    const supabase = await createClient();
    const headersList = await headers();
    
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || null;
    const userAgent = headersList.get("user-agent") || null;

    const deviceInfo = userAgent ? { userAgent } : null;

    // Only log if we have a user ID (don't log failed attempts for non-existent users)
    if (userId) {
      await supabase.from("login_history").insert({
        user_id: userId,
        ip_address: ipAddress,
        user_agent: userAgent,
        device_info: deviceInfo,
        success: false,
        failure_reason: failureReason,
        two_factor_used: false,
      });
    }
  } catch (error) {
    logger.error("Error logging failed login", error);
    // Don't throw - logging failures shouldn't break login flow
  }
}

/**
 * Update login history to mark 2FA as used
 * @param sessionToken Session token from Supabase
 */
export async function updateLoginHistoryWith2FA(
  sessionToken: string,
): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    // Update the most recent successful login history entry for this user
    // to mark that 2FA was used
    await supabase
      .from("login_history")
      .update({ two_factor_used: true })
      .eq("user_id", user.id)
      .eq("success", true)
      .order("created_at", { ascending: false })
      .limit(1);
  } catch (error) {
    logger.error("Error updating login history with 2FA", error);
    // Don't throw - logging failures shouldn't break login flow
  }
}

