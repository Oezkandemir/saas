import { supabase } from "../lib/supabase";
import { ApiClient, ApiResponse } from "./client";

export interface UserNotification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: string;
  read: boolean;
  action_url: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
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
 * Get all notifications with pagination (admin only)
 */
export async function getAllNotifications(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  userId?: string;
  type?: string;
  read?: boolean;
}): Promise<ApiResponse<PaginatedResponse<UserNotification>>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 50;
    const search = options?.search?.toLowerCase().trim();
    const userId = options?.userId;
    const type = options?.type;
    const read = options?.read;

    let query = supabase
      .from("user_notifications")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    }

    if (type) {
      query = query.eq("type", type);
    }

    if (read !== undefined) {
      query = query.eq("read", read);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await query.range(from, to);

    if (error) {
      if (error.code === "PGRST116") {
        // Table doesn't exist
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

    const notifications: UserNotification[] = (data || []).map((n: any) => ({
      id: n.id,
      user_id: n.user_id,
      title: n.title,
      content: n.content,
      type: n.type,
      read: n.read,
      action_url: n.action_url,
      metadata: n.metadata,
      created_at: n.created_at,
      user: undefined, // User info not needed for popover, can be fetched separately if needed
    }));

    return {
      data: {
        data: notifications,
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
 * Get notification statistics
 */
export async function getNotificationStats(): Promise<ApiResponse<NotificationStats>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data: notifications, error } = await supabase
      .from("user_notifications")
      .select("type, read, created_at");

    if (error) {
      if (error.code === "PGRST116") {
        return {
          data: {
            total: 0,
            unread: 0,
            byType: {},
            recent: 0,
          },
          error: null,
        };
      }
      return { data: null, error };
    }

    const notificationList = notifications || [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const stats: NotificationStats = {
      total: notificationList.length,
      unread: notificationList.filter((n) => !n.read).length,
      byType: {},
      recent: notificationList.filter(
        (n) => new Date(n.created_at) >= sevenDaysAgo
      ).length,
    };

    notificationList.forEach((n) => {
      stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
    });

    return { data: stats, error: null };
  });
}

/**
 * Create a notification (admin only)
 * Uses RPC function to bypass RLS policies
 */
export async function createNotification(input: {
  user_id: string;
  title: string;
  content: string;
  type: string;
  action_url?: string;
  metadata?: Record<string, any>;
}): Promise<ApiResponse<UserNotification>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    // First, try to use the RPC function if it exists (bypasses RLS)
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "_create_notification_internal",
      {
        p_user_id: input.user_id,
        p_title: input.title,
        p_content: input.content,
        p_type: input.type,
        p_action_url: input.action_url || null,
        p_metadata: input.metadata || null,
      }
    );

    // If RPC function exists and succeeded, fetch the created notification
    if (!rpcError && rpcData) {
      const { data: notification, error: fetchError } = await supabase
        .from("user_notifications")
        .select(
          `
          *,
          users!user_notifications_user_id_fkey (
            id,
            email,
            name
          )
        `
        )
        .eq("id", rpcData)
        .single();

      if (fetchError) {
        return { data: null, error: fetchError };
      }

      return {
        data: {
          id: notification.id,
          user_id: notification.user_id,
          title: notification.title,
          content: notification.content,
          type: notification.type,
          read: notification.read,
          action_url: notification.action_url,
          metadata: notification.metadata,
          created_at: notification.created_at,
          user: notification.users
            ? {
                id: notification.users.id,
                email: notification.users.email || "",
                name: notification.users.name,
              }
            : undefined,
        },
        error: null,
      };
    }

    // Fallback: Try direct insert
    // This will work if the admin INSERT policy exists (see migration 20250120_admin_notification_insert_policy.sql)
    const { data, error } = await supabase
      .from("user_notifications")
      .insert([
        {
          user_id: input.user_id,
          title: input.title,
          content: input.content,
          type: input.type,
          action_url: input.action_url || null,
          metadata: input.metadata || null,
          read: false,
        },
      ])
      .select(
        `
        *,
        users!user_notifications_user_id_fkey (
          id,
          email,
          name
        )
      `
      )
      .single();

    if (error) {
      // If RPC also failed, return the error
      if (rpcError) {
        return {
          data: null,
          error: new Error(
            `Failed to create notification. RPC error: ${rpcError.message}. Direct insert error: ${error.message}`
          ),
        };
      }
      return { data: null, error };
    }

    return {
      data: {
        id: data.id,
        user_id: data.user_id,
        title: data.title,
        content: data.content,
        type: data.type,
        read: data.read,
        action_url: data.action_url,
        metadata: data.metadata,
        created_at: data.created_at,
        user: data.users
          ? {
              id: data.users.id,
              email: data.users.email || "",
              name: data.users.name,
            }
          : undefined,
      },
      error: null,
    };
  });
}

/**
 * Update notification read status
 */
export async function updateNotificationReadStatus(
  id: string,
  read: boolean
): Promise<ApiResponse<UserNotification>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("user_notifications")
      .update({ read })
      .eq("id", id)
      .select(
        `
        *,
        users!user_notifications_user_id_fkey (
          id,
          email,
          name
        )
      `
      )
      .single();

    if (error) {
      return { data: null, error };
    }

    return {
      data: {
        id: data.id,
        user_id: data.user_id,
        title: data.title,
        content: data.content,
        type: data.type,
        read: data.read,
        action_url: data.action_url,
        metadata: data.metadata,
        created_at: data.created_at,
        user: data.users
          ? {
              id: data.users.id,
              email: data.users.email || "",
              name: data.users.name,
            }
          : undefined,
      },
      error: null,
    };
  });
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  id: string
): Promise<ApiResponse<boolean>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("user_notifications")
      .delete()
      .eq("id", id)
      .select();

    if (error) {
      console.error("Delete notification error:", error);
      return { data: null, error };
    }

    // Check if any rows were deleted
    if (!data || data.length === 0) {
      return {
        data: null,
        error: new Error("Notification not found or could not be deleted"),
      };
    }

    return { data: true, error: null };
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<ApiResponse<boolean>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { error } = await supabase
      .from("user_notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      return { data: null, error };
    }

    return { data: true, error: null };
  });
}

/**
 * Bulk delete notifications
 */
export async function bulkDeleteNotifications(
  ids: string[]
): Promise<ApiResponse<boolean>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    if (!ids || ids.length === 0) {
      return {
        data: null,
        error: new Error("No notification IDs provided"),
      };
    }

    const { data, error } = await supabase
      .from("user_notifications")
      .delete()
      .in("id", ids)
      .select();

    if (error) {
      console.error("Bulk delete notifications error:", error);
      return { data: null, error };
    }

    // Check if any rows were deleted
    if (!data || data.length === 0) {
      return {
        data: null,
        error: new Error("No notifications were deleted. They may not exist or you may not have permission."),
      };
    }

    return { data: true, error: null };
  });
}
