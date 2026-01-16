import { supabase } from "../lib/supabase";
import { ApiClient, ApiResponse } from "./client";

export interface FeatureUsage {
  id: string;
  user_id: string;
  feature_name: string;
  metadata: Record<string, any> | null;
  created_at: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
}

export interface FeatureUsageStats {
  total: number;
  byFeature: Array<{ feature: string; count: number }>;
  byDate: Array<{ date: string; count: number }>;
  topUsers: Array<{ user_id: string; email: string; count: number }>;
  recent: number; // Last 7 days
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Get all feature usage with pagination (admin only)
 */
export async function getAllFeatureUsage(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  userId?: string;
  featureName?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<PaginatedResponse<FeatureUsage>>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 50;
    const userId = options?.userId;
    const featureName = options?.featureName;
    const startDate = options?.startDate;
    const endDate = options?.endDate;

    let query = supabase
      .from("feature_usage")
      .select(
        `
        *,
        users!feature_usage_user_id_fkey (
          id,
          email,
          name
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    }

    if (featureName) {
      query = query.eq("feature_name", featureName);
    }

    if (startDate) {
      query = query.gte("created_at", startDate);
    }

    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await query.range(from, to);

    if (error) {
      if (error.code === "PGRST116") {
        return {
          data: {
            data: [],
            total: 0,
            page,
            pageSize,
            totalPages: 0,
          },
          error: null,
        };
      }
      return { data: null, error };
    }

    const featureUsage: FeatureUsage[] = (data || []).map((fu: any) => ({
      id: fu.id,
      user_id: fu.user_id,
      feature_name: fu.feature_name,
      metadata: fu.metadata,
      created_at: fu.created_at,
      user: fu.users
        ? {
            id: fu.users.id,
            email: fu.users.email || "",
            name: fu.users.name,
          }
        : undefined,
    }));

    return {
      data: {
        data: featureUsage,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
      error: null,
    };
  });
}

/**
 * Get feature usage statistics
 */
export async function getFeatureUsageStats(
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<FeatureUsageStats>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    let query = supabase.from("feature_usage").select("*");

    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    const { data: usage, error } = await query;

    if (error) {
      if (error.code === "PGRST116") {
        return {
          data: {
            total: 0,
            byFeature: [],
            byDate: [],
            topUsers: [],
            recent: 0,
          },
          error: null,
        };
      }
      return { data: null, error };
    }

    const usageList = usage || [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Aggregate by feature
    const featureMap = new Map<string, number>();
    usageList.forEach((u: any) => {
      featureMap.set(u.feature_name, (featureMap.get(u.feature_name) || 0) + 1);
    });
    const byFeature = Array.from(featureMap.entries())
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count);

    // Aggregate by date
    const dateMap = new Map<string, number>();
    usageList.forEach((u: any) => {
      const date = new Date(u.created_at).toISOString().split("T")[0];
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });
    const byDate = Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days

    // Top users
    const userMap = new Map<string, { email: string; count: number }>();
    usageList.forEach((u: any) => {
      const existing = userMap.get(u.user_id) || { email: u.user_id, count: 0 };
      userMap.set(u.user_id, { ...existing, count: existing.count + 1 });
    });

    // Get user emails
    const userIds = Array.from(userMap.keys());
    let usersMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, email")
        .in("id", userIds);

      if (users) {
        users.forEach((u: any) => {
          usersMap[u.id] = u.email || u.id;
        });
      }
    }

    const topUsers = Array.from(userMap.entries())
      .map(([user_id, data]) => ({
        user_id,
        email: usersMap[user_id] || user_id,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const stats: FeatureUsageStats = {
      total: usageList.length,
      byFeature,
      byDate,
      topUsers,
      recent: usageList.filter(
        (u: any) => new Date(u.created_at) >= sevenDaysAgo
      ).length,
    };

    return { data: stats, error: null };
  });
}
