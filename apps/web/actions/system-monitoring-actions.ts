"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getSystemStatus,
  performHealthCheck as performHealthCheckLib,
  type SystemComponent,
  type SystemStatus,
} from "@/lib/system-monitoring";

export interface SystemErrorRecord {
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
export async function getSystemStatusOverview(): Promise<
  | {
      success: true;
      overallStatus: "operational" | "degraded" | "down";
      components: Array<{
        component: string;
        status: string;
        message: string | null;
        lastCheck: string;
      }>;
    }
  | { success: false; message: string }
> {
  try {
    const result = await getSystemStatus();
    if (!result.success) {
      return result;
    }

    // Determine overall status
    const statuses = result.statuses.map((s) => s.status);
    let overallStatus: "operational" | "degraded" | "down" = "operational";
    
    if (statuses.includes("down")) {
      overallStatus = "down";
    } else if (statuses.includes("degraded") || statuses.includes("maintenance")) {
      overallStatus = "degraded";
    }

    return {
      success: true,
      overallStatus,
      components: result.statuses,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to get system status",
    };
  }
}

/**
 * Get recent system errors
 * @param limit Number of errors to return
 * @param component Optional component filter
 */
export async function getRecentErrors(
  limit: number = 50,
  component?: SystemComponent,
): Promise<
  | { success: true; errors: SystemErrorRecord[] }
  | { success: false; message: string }
> {
  try {
    const supabase = await createClient();
    
    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user?.id)
      .single();

    if (userData?.role !== "ADMIN") {
      return { success: false, message: "Unauthorized" };
    }

    let query = supabase
      .from("system_errors")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (component) {
      query = query.eq("component", component);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, message: "Failed to fetch errors" };
    }

    return {
      success: true,
      errors: (data || []).map((e) => ({
        id: e.id,
        component: e.component,
        errorType: e.error_type,
        errorMessage: e.error_message,
        errorStack: e.error_stack,
        context: e.context,
        userId: e.user_id,
        resolved: e.resolved,
        resolvedAt: e.resolved_at,
        resolvedBy: e.resolved_by,
        createdAt: e.created_at,
      })),
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to get errors",
    };
  }
}

/**
 * Mark error as resolved
 */
export async function resolveError(
  errorId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Not authenticated" };
    }

    const { error } = await supabase
      .from("system_errors")
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
      })
      .eq("id", errorId);

    if (error) {
      return { success: false, message: "Failed to resolve error" };
    }

    return { success: true, message: "Error marked as resolved" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to resolve error",
    };
  }
}

/**
 * Get error statistics
 */
export async function getErrorStatistics(): Promise<
  | {
      success: true;
      stats: {
        total: number;
        critical: number;
        warning: number;
        unresolved: number;
        byComponent: Record<string, number>;
      };
    }
  | { success: false; message: string }
> {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user?.id)
      .single();

    if (userData?.role !== "ADMIN") {
      return { success: false, message: "Unauthorized" };
    }

    const { data: errors, error } = await supabase
      .from("system_errors")
      .select("error_type, component, resolved");

    if (error) {
      return { success: false, message: "Failed to fetch error statistics" };
    }

    const stats = {
      total: errors?.length || 0,
      critical: errors?.filter((e) => e.error_type === "critical").length || 0,
      warning: errors?.filter((e) => e.error_type === "warning").length || 0,
      unresolved: errors?.filter((e) => !e.resolved).length || 0,
      byComponent: {} as Record<string, number>,
    };

    // Count by component
    errors?.forEach((error) => {
      stats.byComponent[error.component] = (stats.byComponent[error.component] || 0) + 1;
    });

    return { success: true, stats };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to get statistics",
    };
  }
}

/**
 * Perform health check on all system components
 */
export async function performHealthCheck(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    await performHealthCheckLib();
    return { success: true, message: "Health check completed successfully" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Health check failed",
    };
  }
}

