"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getSystemStatus,
  performHealthCheck as performHealthCheckLib,
  type SystemComponent,
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
    } else if (
      statuses.includes("degraded") ||
      statuses.includes("maintenance")
    ) {
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
      message:
        error instanceof Error ? error.message : "Failed to get system status",
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
      message:
        error instanceof Error ? error.message : "Failed to resolve error",
    };
  }
}

/**
 * Bulk resolve errors by filter criteria
 */
export async function bulkResolveErrors(filters?: {
  component?: string;
  errorType?: string;
  errorMessagePattern?: string;
  resolved?: boolean;
}): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Not authenticated" };
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "ADMIN") {
      return { success: false, message: "Unauthorized: Admin access required" };
    }

    let query = supabase
      .from("system_errors")
      .select("id", { count: "exact" })
      .eq("resolved", filters?.resolved ?? false);

    if (filters?.component) {
      query = query.eq("component", filters.component);
    }

    if (filters?.errorType) {
      query = query.eq("error_type", filters.errorType);
    }

    if (filters?.errorMessagePattern) {
      query = query.ilike("error_message", `%${filters.errorMessagePattern}%`);
    }

    const { data: errorIds, error: selectError, count } = await query;

    if (selectError) {
      return { success: false, message: "Failed to fetch errors" };
    }

    if (!errorIds || errorIds.length === 0) {
      return { success: true, message: "No errors found to resolve", count: 0 };
    }

    const ids = errorIds.map((e) => e.id);

    const { error: updateError } = await supabase
      .from("system_errors")
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
      })
      .in("id", ids);

    if (updateError) {
      return { success: false, message: "Failed to resolve errors" };
    }

    return {
      success: true,
      message: `Successfully resolved ${count || ids.length} error(s)`,
      count: count || ids.length,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to resolve errors",
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
      stats.byComponent[error.component] =
        (stats.byComponent[error.component] || 0) + 1;
    });

    return { success: true, stats };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to get statistics",
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

/**
 * Delete the oldest N system errors
 * @param limit Number of errors to delete (default: 50)
 */
export async function deleteOldestErrors(
  limit: number = 50,
): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Not authenticated" };
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "ADMIN") {
      return { success: false, message: "Unauthorized: Admin access required" };
    }

    // Get the IDs of the oldest errors
    const { data: oldestErrors, error: selectError } = await supabase
      .from("system_errors")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(limit);

    if (selectError) {
      return { success: false, message: "Failed to fetch errors" };
    }

    if (!oldestErrors || oldestErrors.length === 0) {
      return { success: true, message: "No errors found to delete", count: 0 };
    }

    const ids = oldestErrors.map((e) => e.id);

    // Delete the errors
    const { error: deleteError } = await supabase
      .from("system_errors")
      .delete()
      .in("id", ids);

    if (deleteError) {
      return { success: false, message: "Failed to delete errors" };
    }

    return {
      success: true,
      message: `Successfully deleted ${ids.length} error(s)`,
      count: ids.length,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete errors",
    };
  }
}

/**
 * Delete old resolved errors
 * @param daysOld Number of days old errors should be before deletion
 */
export async function deleteOldResolvedErrors(
  daysOld: number = 30,
): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Not authenticated" };
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "ADMIN") {
      return { success: false, message: "Unauthorized: Admin access required" };
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Count errors to be deleted
    const { count, error: countError } = await supabase
      .from("system_errors")
      .select("*", { count: "exact", head: true })
      .eq("resolved", true)
      .lt("resolved_at", cutoffDate.toISOString());

    if (countError) {
      return { success: false, message: "Failed to count errors" };
    }

    // Delete old resolved errors
    const { error: deleteError } = await supabase
      .from("system_errors")
      .delete()
      .eq("resolved", true)
      .lt("resolved_at", cutoffDate.toISOString());

    if (deleteError) {
      return { success: false, message: "Failed to delete errors" };
    }

    return {
      success: true,
      message: `Successfully deleted ${count || 0} old resolved error(s)`,
      count: count || 0,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete errors",
    };
  }
}

/**
 * Delete all system errors
 * WARNING: This will permanently delete all errors from the database
 */
export async function deleteAllErrors(): Promise<{
  success: boolean;
  message: string;
  count?: number;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Not authenticated" };
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "ADMIN") {
      return { success: false, message: "Unauthorized: Admin access required" };
    }

    // Count errors before deletion
    const { count, error: countError } = await supabase
      .from("system_errors")
      .select("*", { count: "exact", head: true });

    if (countError) {
      return { success: false, message: "Failed to count errors" };
    }

    // Delete all errors - use a condition that matches all rows
    // Since we can't use .delete() without a filter in Supabase, we'll delete by selecting all IDs first
    const { data: allErrors, error: selectError } = await supabase
      .from("system_errors")
      .select("id");

    if (selectError) {
      return { success: false, message: "Failed to fetch errors for deletion" };
    }

    if (!allErrors || allErrors.length === 0) {
      return { success: true, message: "No errors found to delete", count: 0 };
    }

    const ids = allErrors.map((e) => e.id);
    const batchSize = 1000; // Delete in batches to avoid hitting limits

    // Delete errors in batches
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const { error: deleteError } = await supabase
        .from("system_errors")
        .delete()
        .in("id", batch);

      if (deleteError) {
        return {
          success: false,
          message: `Failed to delete errors: ${deleteError.message}`,
        };
      }
    }

    return {
      success: true,
      message: `Successfully deleted all ${count || ids.length} error(s)`,
      count: count || ids.length,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete errors",
    };
  }
}
