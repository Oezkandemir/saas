import { supabase } from "../lib/supabase";
import { ApiClient, ApiResponse } from "./client";

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action?: string;
  activity_type?: string; // For user_activity_logs
  resource_type?: string;
  resource_id?: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
}

/**
 * Get activity feed (admin only)
 * Note: This assumes an audit_logs table exists. If not, we'll use a simplified version.
 */
export async function getActivityFeed(
  limit: number = 100
): Promise<ApiResponse<ActivityLog[]>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    try {
      // First, get audit logs without join to avoid timeout
      const { data: logs, error: logsError } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (logsError) {
        console.error("Error fetching audit logs:", logsError);
        if (logsError.code === "42P01") {
          // Table doesn't exist, return empty array
          return { data: [], error: null };
        }
        // For RLS errors, try to return empty array instead of failing
        if (logsError.code === "42501" || logsError.message?.includes("permission")) {
          console.warn("RLS permission error, returning empty array");
          return { data: [], error: null };
        }
        return { data: null, error: logsError };
      }

      if (!logs || logs.length === 0) {
        console.log("No audit logs found");
        return { data: [], error: null };
      }

      console.log(`Fetched ${logs.length} audit logs`);

      // Get unique user IDs
      const userIds = [...new Set(logs.map((log: any) => log.user_id).filter(Boolean))];

      // Fetch users separately if we have user IDs
      let usersMap: Record<string, { id: string; email: string; name: string | null }> = {};
      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from("users")
          .select("id, email, name")
          .in("id", userIds);

        if (usersError) {
          console.warn("Error fetching users:", usersError);
          // Continue without user info if fetch fails
        } else if (users) {
          users.forEach((user: any) => {
            usersMap[user.id] = {
              id: user.id,
              email: user.email || "",
              name: user.name || null,
            };
          });
        }
      }

      // Map activities with user info
      const activities: ActivityLog[] = logs.map((log: any) => ({
        id: log.id,
        user_id: log.user_id,
        action: log.action,
        resource_type: log.resource_type || null,
        resource_id: log.resource_id || null,
        details: log.details,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        created_at: log.created_at,
        user: log.user_id && usersMap[log.user_id]
          ? usersMap[log.user_id]
          : undefined,
      }));

      console.log(`Mapped ${activities.length} activities`);
      return { data: activities, error: null };
    } catch (error) {
      console.error("Unexpected error in getActivityFeed:", error);
      return { data: null, error: error instanceof Error ? error : new Error("Unknown error") };
    }
  });
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(filters?: {
  userId?: string;
  action?: string;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<ActivityLog[]>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    // Build query without join to avoid timeout
    let query = supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (filters?.userId) {
      query = query.eq("user_id", filters.userId);
    }

    if (filters?.action) {
      query = query.eq("action", filters.action);
    }

    if (filters?.resourceType) {
      query = query.eq("resource_type", filters.resourceType);
    }

    if (filters?.startDate) {
      query = query.gte("created_at", filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte("created_at", filters.endDate);
    }

    const { data: logs, error } = await query;

    if (error && error.code === "42P01") {
      // Table doesn't exist
      return { data: [], error: null };
    }

    if (error) {
      return { data: null, error };
    }

    if (!logs || logs.length === 0) {
      return { data: [], error: null };
    }

    // Get unique user IDs
    const userIds = [...new Set(logs.map((log: any) => log.user_id).filter(Boolean))];

    // Fetch users separately
    let usersMap: Record<string, { id: string; email: string; name: string | null }> = {};
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, email, name")
        .in("id", userIds);

      if (users) {
        users.forEach((user: any) => {
          usersMap[user.id] = {
            id: user.id,
            email: user.email || "",
            name: user.name || null,
          };
        });
      }
    }

    // Map activities with user info
    const activities: ActivityLog[] = logs.map((log: any) => ({
      id: log.id,
      user_id: log.user_id,
      action: log.action,
      resource_type: log.resource_type || null,
      resource_id: log.resource_id || null,
      details: log.details,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      created_at: log.created_at,
      user: log.user_id && usersMap[log.user_id]
        ? usersMap[log.user_id]
        : undefined,
    }));

    return { data: activities, error: null };
  });
}

/**
 * Get user activity logs (from user_activity_logs table)
 */
export async function getUserActivityLogs(filters?: {
  userId?: string;
  activityType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<ApiResponse<ActivityLog[]>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    let query = supabase
      .from("user_activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(filters?.limit || 500);

    if (filters?.userId) {
      query = query.eq("user_id", filters.userId);
    }

    if (filters?.activityType) {
      query = query.eq("activity_type", filters.activityType);
    }

    if (filters?.startDate) {
      query = query.gte("created_at", filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte("created_at", filters.endDate);
    }

    const { data: logs, error } = await query;

    if (error && error.code === "PGRST116") {
      // Table doesn't exist
      return { data: [], error: null };
    }

    if (error) {
      return { data: null, error };
    }

    if (!logs || logs.length === 0) {
      return { data: [], error: null };
    }

    // Get unique user IDs
    const userIds = [...new Set(logs.map((log: any) => log.user_id).filter(Boolean))];

    // Fetch users separately
    let usersMap: Record<string, { id: string; email: string; name: string | null }> = {};
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, email, name")
        .in("id", userIds);

      if (users) {
        users.forEach((user: any) => {
          usersMap[user.id] = {
            id: user.id,
            email: user.email || "",
            name: user.name || null,
          };
        });
      }
    }

    // Map activities with user info
    const activities: ActivityLog[] = logs.map((log: any) => ({
      id: log.id,
      user_id: log.user_id,
      activity_type: log.activity_type,
      details: log.details,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      created_at: log.created_at,
      user: log.user_id && usersMap[log.user_id]
        ? usersMap[log.user_id]
        : undefined,
    }));

    return { data: activities, error: null };
  });
}

/**
 * Get combined activity logs from both audit_logs and user_activity_logs
 */
export async function getCombinedActivityLogs(filters?: {
  userId?: string;
  activityType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<ApiResponse<ActivityLog[]>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    // Fetch from both tables in parallel
    const [auditLogsResult, userActivityLogsResult] = await Promise.all([
      getAuditLogs({
        userId: filters?.userId,
        startDate: filters?.startDate,
        endDate: filters?.endDate,
      }),
      getUserActivityLogs({
        userId: filters?.userId,
        activityType: filters?.activityType,
        startDate: filters?.startDate,
        endDate: filters?.endDate,
        limit: filters?.limit,
      }),
    ]);

    // Combine results
    const auditLogs = auditLogsResult.data || [];
    const userActivityLogs = userActivityLogsResult.data || [];

    // Combine and sort by created_at
    const combined = [...auditLogs, ...userActivityLogs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Apply limit if specified
    const limited = filters?.limit ? combined.slice(0, filters.limit) : combined;

    return { data: limited, error: null };
  });
}
