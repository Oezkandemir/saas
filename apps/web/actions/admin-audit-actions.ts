"use server";

import { supabaseAdmin } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { logger } from "@/lib/logger";

export interface AuditLogEntry {
  id: string;
  admin_id: string | null;
  action_type: string;
  resource_type: string;
  resource_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

/**
 * Get audit log entries
 */
export async function getAuditLogs(
  filters?: {
    action_type?: string;
    resource_type?: string;
    admin_id?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{
  success: boolean;
  data?: AuditLogEntry[];
  count?: number;
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    let query = supabaseAdmin
      .from("admin_audit_log")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (filters?.action_type) {
      query = query.eq("action_type", filters.action_type);
    }

    if (filters?.resource_type) {
      query = query.eq("resource_type", filters.resource_type);
    }

    if (filters?.admin_id) {
      query = query.eq("admin_id", filters.admin_id);
    }

    const limit = filters?.limit || 100;
    const offset = filters?.offset || 0;

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      logger.error("Error fetching audit logs:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [], count: count || 0 };
  } catch (error) {
    logger.error("Error in getAuditLogs:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Create audit log entry (helper function for other actions)
 */
export async function createAuditLog(
  actionType: string,
  resourceType: string,
  resourceId?: string,
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>,
  metadata?: Record<string, any>
): Promise<{
  success: boolean;
  auditId?: string;
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      // Don't fail if not admin, just skip audit log
      return { success: true };
    }

    const { data, error } = await supabaseAdmin.rpc("create_audit_log", {
      p_action_type: actionType,
      p_resource_type: resourceType,
      p_resource_id: resourceId || null,
      p_old_values: oldValues || null,
      p_new_values: newValues || null,
      p_metadata: metadata || {},
    });

    if (error) {
      logger.error("Error creating audit log:", error);
      // Don't fail the main operation if audit log fails
      return { success: true };
    }

    return { success: true, auditId: data };
  } catch (error) {
    logger.error("Error in createAuditLog:", error);
    // Don't fail the main operation if audit log fails
    return { success: true };
  }
}


