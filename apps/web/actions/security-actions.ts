"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export interface ActiveSession {
  id: string;
  sessionToken: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceInfo: Record<string, unknown> | null;
  locationInfo: Record<string, unknown> | null;
  isCurrent: boolean;
  lastActivity: string;
  createdAt: string;
  expiresAt: string;
}

export interface LoginHistoryEntry {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceInfo: Record<string, unknown> | null;
  locationInfo: Record<string, unknown> | null;
  success: boolean;
  failureReason: string | null;
  twoFactorUsed: boolean;
  createdAt: string;
}

/**
 * Get all active sessions for current user
 * @returns Array of active sessions
 */
export async function getActiveSessions(): Promise<
  | { success: true; sessions: ActiveSession[] }
  | { success: false; message: string }
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    // Get current session token
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();

    const { data, error } = await supabase
      .from("login_sessions")
      .select("*")
      .eq("user_id", user.id)
      .gte("expires_at", new Date().toISOString())
      .order("last_activity", { ascending: false });

    if (error) {
      return { success: false, message: "Failed to fetch sessions" };
    }

    // If no sessions exist but user is logged in, create one
    if ((!data || data.length === 0) && currentSession) {
      const { createLoginSession } = await import("@/lib/session-tracking");
      const expiresAt = new Date(currentSession.expires_at! * 1000);
      await createLoginSession(user.id, expiresAt);

      // Fetch again after creating
      const { data: newData } = await supabase
        .from("login_sessions")
        .select("*")
        .eq("user_id", user.id)
        .gte("expires_at", new Date().toISOString())
        .order("last_activity", { ascending: false });

      if (newData && newData.length > 0) {
        return {
          success: true,
          sessions: newData.map((session) => ({
            id: session.id,
            sessionToken: session.session_token,
            ipAddress: session.ip_address,
            userAgent: session.user_agent,
            deviceInfo: session.device_info,
            locationInfo: session.location_info,
            isCurrent: session.session_token === currentSession.access_token,
            lastActivity: session.last_activity,
            createdAt: session.created_at,
            expiresAt: session.expires_at,
          })),
        };
      }
    }

    return {
      success: true,
      sessions: (data || []).map((session) => ({
        id: session.id,
        sessionToken: session.session_token,
        ipAddress: session.ip_address,
        userAgent: session.user_agent,
        deviceInfo: session.device_info,
        locationInfo: session.location_info,
        isCurrent: currentSession
          ? session.session_token === currentSession.access_token
          : session.is_current,
        lastActivity: session.last_activity,
        createdAt: session.created_at,
        expiresAt: session.expires_at,
      })),
    };
  } catch (error) {
    logger.error("Error getting active sessions:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to get sessions",
    };
  }
}

/**
 * Revoke a specific session
 * @param sessionId Session ID to revoke
 * @returns Success status
 */
export async function revokeSession(
  sessionId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    // Verify session belongs to user
    const { data: session, error: fetchError } = await supabase
      .from("login_sessions")
      .select("id, is_current")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !session) {
      return { success: false, message: "Session not found" };
    }

    // Don't allow revoking current session
    if (session.is_current) {
      return { success: false, message: "Cannot revoke current session" };
    }

    // Delete session
    const { error: deleteError } = await supabase
      .from("login_sessions")
      .delete()
      .eq("id", sessionId);

    if (deleteError) {
      return { success: false, message: "Failed to revoke session" };
    }

    // Log to audit
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "SESSION_REVOKED",
      details: { sessionId, timestamp: new Date().toISOString() },
    });

    revalidatePath("/dashboard/settings/security");
    return { success: true, message: "Session revoked successfully" };
  } catch (error) {
    logger.error("Error revoking session:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to revoke session",
    };
  }
}

/**
 * Revoke all sessions except current
 * @returns Success status
 */
export async function revokeAllOtherSessions(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    // Delete all sessions except current
    const { error: deleteError } = await supabase
      .from("login_sessions")
      .delete()
      .eq("user_id", user.id)
      .eq("is_current", false);

    if (deleteError) {
      return { success: false, message: "Failed to revoke sessions" };
    }

    // Log to audit
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "ALL_SESSIONS_REVOKED",
      details: { timestamp: new Date().toISOString() },
    });

    revalidatePath("/dashboard/settings/security");
    return {
      success: true,
      message: "All other sessions revoked successfully",
    };
  } catch (error) {
    logger.error("Error revoking all sessions:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to revoke sessions",
    };
  }
}

/**
 * Clear all sessions including current one (signs out user)
 * Useful for testing 2FA flow
 * @returns Success status
 */
export async function clearAllSessions(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    // Delete all sessions including current
    const { error: deleteError } = await supabase
      .from("login_sessions")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      return { success: false, message: "Failed to clear sessions" };
    }

    // Sign out from Supabase auth
    await supabase.auth.signOut();

    // Log to audit
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "ALL_SESSIONS_CLEARED",
      details: { timestamp: new Date().toISOString() },
    });

    revalidatePath("/dashboard/settings/security");
    return { success: true, message: "All sessions cleared successfully" };
  } catch (error) {
    logger.error("Error clearing all sessions:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to clear sessions",
    };
  }
}

/**
 * Get login history for current user
 * @param limit Number of entries to return
 * @returns Array of login history entries
 */
export async function getLoginHistory(
  limit: number = 50
): Promise<
  | { success: true; history: LoginHistoryEntry[] }
  | { success: false; message: string }
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("login_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, message: "Failed to fetch login history" };
    }

    return {
      success: true,
      history: (data || []).map((entry) => ({
        id: entry.id,
        ipAddress: entry.ip_address,
        userAgent: entry.user_agent,
        deviceInfo: entry.device_info,
        locationInfo: entry.location_info,
        success: entry.success,
        failureReason: entry.failure_reason,
        twoFactorUsed: entry.two_factor_used,
        createdAt: entry.created_at,
      })),
    };
  } catch (error) {
    logger.error("Error getting login history:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to get login history",
    };
  }
}

/**
 * Log login attempt to history
 * @param success Whether login was successful
 * @param failureReason Reason for failure if unsuccessful
 * @param twoFactorUsed Whether 2FA was used
 */
export async function logLoginAttempt(
  success: boolean,
  failureReason?: string,
  twoFactorUsed: boolean = false
): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      null;
    const userAgent = headersList.get("user-agent") || null;

    // Extract device info from user agent (simplified)
    const deviceInfo = userAgent
      ? {
          userAgent,
          // Could be enhanced with device detection library
        }
      : null;

    await supabase.from("login_history").insert({
      user_id: user.id,
      ip_address: ipAddress,
      user_agent: userAgent,
      device_info: deviceInfo,
      success,
      failure_reason: failureReason || null,
      two_factor_used: twoFactorUsed,
    });
  } catch (error) {
    logger.error("Error logging login attempt:", error);
    // Don't throw - logging failures shouldn't break login flow
  }
}
