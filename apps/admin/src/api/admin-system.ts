import { supabase } from "../lib/supabase";
import { ApiClient, ApiResponse } from "./client";

export interface SystemComponent {
  component: string;
  status: "operational" | "degraded" | "down" | "maintenance";
  message: string | null;
  lastCheck: string;
}

export interface SystemStatus {
  overallStatus: "operational" | "degraded" | "down";
  components: SystemComponent[];
}

export interface SystemError {
  id: string;
  component: string;
  errorType: string;
  errorMessage: string;
  errorStack: string | null;
  context: Record<string, unknown> | null;
  userId: string | null;
  resolved: boolean;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
}

/**
 * Get system status overview
 */
export async function getSystemStatus(): Promise<ApiResponse<SystemStatus>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    // Check database connection
    const { error: dbError } = await supabase.from("users").select("id").limit(1);

    const components: SystemComponent[] = [
      {
        component: "Database",
        status: dbError ? "down" : "operational",
        message: dbError ? dbError.message : null,
        lastCheck: new Date().toISOString(),
      },
      {
        component: "Authentication",
        status: "operational",
        message: null,
        lastCheck: new Date().toISOString(),
      },
      {
        component: "API",
        status: "operational",
        message: null,
        lastCheck: new Date().toISOString(),
      },
    ];

    const statuses = components.map((c) => c.status);
    let overallStatus: "operational" | "degraded" | "down" = "operational";

    if (statuses.includes("down")) {
      overallStatus = "down";
    } else if (
      statuses.includes("degraded") ||
      statuses.includes("maintenance")
    ) {
      overallStatus = "degraded";
    }

    return {
      data: {
        overallStatus,
        components,
      },
      error: null,
    };
  });
}

/**
 * Get recent system errors
 */
export async function getRecentErrors(
  limit = 50,
  component?: string
): Promise<ApiResponse<SystemError[]>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    let query = supabase
      .from("system_errors")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (component) {
      query = query.eq("component", component);
    }

    const { data, error } = await query;

    if (error && error.code !== "PGRST116") {
      return { data: null, error };
    }

    return {
      data: (data || []).map((error) => ({
        ...error,
        context:
          typeof error.context === "object"
            ? (error.context as Record<string, unknown>)
            : null,
      })) as SystemError[],
      error: null,
    };
  });
}

/**
 * Resolve a system error
 */
export async function resolveError(
  errorId: string
): Promise<ApiResponse<void>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("system_errors")
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: user?.id || null,
      })
      .eq("id", errorId);

    if (error) {
      return { data: null, error };
    }

    return { data: undefined, error: null };
  });
}

/**
 * Send a test notification to all admins
 */
export async function sendTestNotification(): Promise<ApiResponse<void>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { error } = await supabase.rpc("notify_all_admins", {
      p_title: "Test System Notification",
      p_content: "This is a test notification sent from the admin system page to verify the notification system is working correctly.",
      p_type: "SYSTEM",
      p_action_url: "/admin/system",
      p_metadata: {
        test: true,
        timestamp: new Date().toISOString(),
        source: "admin_system_page",
      },
    });

    if (error) {
      return { data: null, error };
    }

    return { data: undefined, error: null };
  });
}
