"use server";

import { redirect } from "next/navigation";

import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export type SearchFilters = {
  query?: string;
  role?: "USER" | "ADMIN" | "all";
  sortBy?: "name" | "email" | "created_at";
  sortOrder?: "asc" | "desc";
};

export type UserSearchResult = {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
};

export type SearchResults = {
  users: UserSearchResult[];
  totalCount: number;
  hasMore: boolean;
};

/**
 * Search users with filters and pagination
 */
export async function searchUsers(
  filters: SearchFilters = {},
  page = 1,
  limit = 20
): Promise<SearchResults> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      redirect("/login");
    }

    const supabase = await createClient();
    const offset = (page - 1) * limit;

    // Build the query
    let query = supabase
      .from("users")
      .select("id, name, email, avatar_url, role, created_at", {
        count: "exact",
      });

    // Apply search filter
    if (filters.query) {
      const searchTerm = `%${filters.query.toLowerCase()}%`;
      query = query.or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`);
    }

    // Apply role filter
    if (filters.role && filters.role !== "all") {
      query = query.eq("role", filters.role);
    }

    // Apply sorting
    const sortBy = filters.sortBy || "created_at";
    const sortOrder = filters.sortOrder || "desc";
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) {
      logger.error("Error searching users", error);
      return {
        users: [],
        totalCount: 0,
        hasMore: false,
      };
    }

    return {
      users: users || [],
      totalCount: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  } catch (error) {
    logger.error("Search users error", error);
    return {
      users: [],
      totalCount: 0,
      hasMore: false,
    };
  }
}

/**
 * Get suggested users (recent users)
 */
export async function getSuggestedUsers(
  limit = 10
): Promise<UserSearchResult[]> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return [];
    }

    const supabase = await createClient();

    // Get recent users, excluding current user
    const { data: users, error } = await supabase
      .from("users")
      .select(
        `
        id,
        name,
        email,
        avatar_url,
        role,
        created_at
      `
      )
      .neq("id", currentUser.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      logger.error("Error getting suggested users", error);
      return [];
    }

    return users || [];
  } catch (error) {
    logger.error("Get suggested users error", error);
    return [];
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(): Promise<{
  totalUsers: number;
  totalAdmins: number;
  recentJoins: number;
}> {
  try {
    const supabase = await createClient();

    // Get total users count
    const { count: totalUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    // Get admin count
    const { count: totalAdmins } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "ADMIN");

    // Get users joined in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentJoins } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString());

    return {
      totalUsers: totalUsers || 0,
      totalAdmins: totalAdmins || 0,
      recentJoins: recentJoins || 0,
    };
  } catch (error) {
    logger.error("Get user stats error", error);
    return {
      totalUsers: 0,
      totalAdmins: 0,
      recentJoins: 0,
    };
  }
}
