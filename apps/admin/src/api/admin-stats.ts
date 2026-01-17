import { supabase } from "../lib/supabase";
import { ApiClient, ApiResponse } from "./client";

export interface AdminStats {
  totalUsers: number;
  adminUsers: number;
  subscribedUsers: number;
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
}

/**
 * Get optimized admin statistics using SQL function
 */
export async function getAdminStats(): Promise<ApiResponse<AdminStats>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase.rpc("get_admin_stats");

    if (error) {
      // Fallback to manual queries if function doesn't exist
      const [usersResult, ticketsResult] = await Promise.all([
        supabase.from("users").select("role, polar_subscription_id, stripe_subscription_id"),
        supabase.from("support_tickets").select("status"),
      ]);

      if (usersResult.error || ticketsResult.error) {
        throw new Error("Failed to fetch stats");
      }

      const users = usersResult.data || [];
      const tickets = ticketsResult.data || [];

      return {
        data: {
          totalUsers: users.length,
          adminUsers: users.filter((u) => u.role === "ADMIN").length,
          subscribedUsers: users.filter(
            (u) => u.polar_subscription_id || u.stripe_subscription_id
          ).length,
          totalTickets: tickets.length,
          openTickets: tickets.filter((t) => t.status === "open").length,
          inProgressTickets: tickets.filter((t) => t.status === "in_progress").length,
          resolvedTickets: tickets.filter((t) =>
            ["resolved", "closed"].includes(t.status)
          ).length,
        },
        error: null,
      };
    }

    if (!data || data.length === 0) {
      return {
        data: {
          totalUsers: 0,
          adminUsers: 0,
          subscribedUsers: 0,
          totalTickets: 0,
          openTickets: 0,
          inProgressTickets: 0,
          resolvedTickets: 0,
        },
        error: null,
      };
    }

    const stats = data[0];
    return {
      data: {
        totalUsers: Number(stats.total_users) || 0,
        adminUsers: Number(stats.admin_users) || 0,
        subscribedUsers: Number(stats.subscribed_users) || 0,
        totalTickets: Number(stats.total_tickets) || 0,
        openTickets: Number(stats.open_tickets) || 0,
        inProgressTickets: Number(stats.in_progress_tickets) || 0,
        resolvedTickets: Number(stats.resolved_tickets) || 0,
      },
      error: null,
    };
  });
}
