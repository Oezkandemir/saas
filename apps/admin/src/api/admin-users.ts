import { supabase } from "../lib/supabase";
import { ApiClient, ApiResponse } from "./client";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  avatar_url: string | null;
  status: string;
  created_at: string;
  polar_subscription_id: string | null;
  stripe_subscription_id: string | null;
}

export interface UserStats {
  total: number;
  admins: number;
  regularUsers: number;
  banned: number;
  withSubscription: number;
  recent: number; // Last 30 days
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Get all users with pagination (admin only)
 */
export async function getAllUsers(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  status?: string;
}): Promise<ApiResponse<PaginatedResponse<User>>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 50;
    const search = options?.search?.toLowerCase().trim() || undefined;
    const role = options?.role;
    const status = options?.status;

    // Build query - first try with direct fields (users table should have email, name, avatar_url)
    // If user_profiles exists, we'll try to join it, but it's optional
    let query = supabase
      .from("users")
      .select(
        `
        id,
        role,
        status,
        polar_subscription_id,
        stripe_subscription_id,
        created_at,
        email,
        name,
        avatar_url
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    // Apply search filter (search in users email/name)
    if (search && search.length > 0) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    // Apply role filter
    if (role && role !== "all") {
      query = query.eq("role", role);
    }

    // Apply status filter
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let { data, error, count } = await query.range(from, to);


    if (error) {
      console.error("Error fetching users:", error);
      return { data: null, error };
    }

    console.log("Fetched users:", {
      dataLength: data?.length || 0,
      count,
      page,
      pageSize,
      from,
      to,
    });

    // Map users - use direct fields from users table
    let users: User[] = (data || []).map((u: any) => {
      // Ensure we have valid data
      if (!u.id) {
        console.warn("User without ID:", u);
        return null;
      }

      return {
        id: u.id,
        email: u.email || "",
        name: u.name || null,
        role: u.role || "USER",
        avatar_url: u.avatar_url || null,
        status: u.status || "active",
        created_at: u.created_at || new Date().toISOString(),
        polar_subscription_id: u.polar_subscription_id || null,
        stripe_subscription_id: u.stripe_subscription_id || null,
      };
    }).filter((u): u is User => u !== null); // Filter out any null entries

    // Apply client-side search if needed (since we can't search joined tables easily)
    // Note: This filters after pagination, so we might need to fetch more data
    // For better performance, consider a database function or view
    if (search && search.length > 0) {
      const filteredUsers = users.filter((user) => {
        const searchLower = search.toLowerCase();
        return (
          user.email?.toLowerCase().includes(searchLower) ||
          user.name?.toLowerCase().includes(searchLower) ||
          user.id.toLowerCase().includes(searchLower)
        );
      });
      
      // If we filtered out all results, we might need to fetch more data
      // For now, just use the filtered results
      users = filteredUsers;
      // Note: Count might be inaccurate after client-side filtering
      // For accurate counts with search, we'd need server-side search
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    console.log("Fetched users:", {
      dataLength: users.length,
      count,
      page,
      pageSize,
      from,
      to,
    });

    return {
      data: {
        data: users,
        total,
        page,
        pageSize,
        totalPages,
      },
      error: null,
    };
  });
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<ApiResponse<User>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        role,
        status,
        polar_subscription_id,
        stripe_subscription_id,
        created_at,
        email,
        name,
        avatar_url
      `)
      .eq("id", id)
      .single();

    if (error) {
      return { data: null, error };
    }

    const user: User = {
      id: data.id,
      email: data.email || "",
      name: data.name || null,
      role: data.role || "USER",
      avatar_url: data.avatar_url || null,
      status: data.status || "active",
      created_at: data.created_at || new Date().toISOString(),
      polar_subscription_id: data.polar_subscription_id || null,
      stripe_subscription_id: data.stripe_subscription_id || null,
    };

    return { data: user, error: null };
  });
}

/**
 * Get user statistics
 */
export async function getUserStats(): Promise<ApiResponse<UserStats>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    // Get total count
    const { count: total, error: totalError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (totalError) {
      return { data: null, error: totalError };
    }

    // Get admin count
    const { count: admins, error: adminError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "ADMIN");

    if (adminError) {
      return { data: null, error: adminError };
    }

    // Get regular users count
    const { count: regularUsers, error: regularError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "USER");

    if (regularError) {
      return { data: null, error: regularError };
    }

    // Get banned count
    const { count: banned, error: bannedError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("status", "banned");

    if (bannedError) {
      return { data: null, error: bannedError };
    }

    // Get users with subscription
    const { count: withSubscription, error: subError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .or("polar_subscription_id.not.is.null,stripe_subscription_id.not.is.null");

    if (subError) {
      return { data: null, error: subError };
    }

    // Get recent count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { count: recent, error: recentError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString());

    if (recentError) {
      return { data: null, error: recentError };
    }

    const stats: UserStats = {
      total: total || 0,
      admins: admins || 0,
      regularUsers: regularUsers || 0,
      banned: banned || 0,
      withSubscription: withSubscription || 0,
      recent: recent || 0,
    };

    return { data: stats, error: null };
  });
}

/**
 * Update user role
 */
export async function updateUserRole(
  userId: string,
  newRole: string
): Promise<ApiResponse<void>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { error } = await supabase
      .from("users")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      return { data: null, error };
    }

    return { data: undefined, error: null };
  });
}

/**
 * Update user status (ban/unban)
 */
export async function updateUserStatus(
  userId: string,
  status: "active" | "banned"
): Promise<ApiResponse<void>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { error } = await supabase
      .from("users")
      .update({ status })
      .eq("id", userId);

    if (error) {
      return { data: null, error };
    }

    return { data: undefined, error: null };
  });
}

/**
 * Delete user
 */
export async function deleteUser(userId: string): Promise<ApiResponse<void>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    // Delete from users table (cascade should handle related records)
    const { error } = await supabase.from("users").delete().eq("id", userId);

    if (error) {
      return { data: null, error };
    }

    return { data: undefined, error: null };
  });
}

/**
 * Bulk update user roles
 */
export async function bulkUpdateUserRoles(
  userIds: string[],
  newRole: string
): Promise<ApiResponse<void>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { error } = await supabase
      .from("users")
      .update({ role: newRole })
      .in("id", userIds);

    if (error) {
      return { data: null, error };
    }

    return { data: undefined, error: null };
  });
}

/**
 * Bulk update user status
 */
export async function bulkUpdateUserStatus(
  userIds: string[],
  status: "active" | "banned"
): Promise<ApiResponse<void>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { error } = await supabase
      .from("users")
      .update({ status })
      .in("id", userIds);

    if (error) {
      return { data: null, error };
    }

    return { data: undefined, error: null };
  });
}
