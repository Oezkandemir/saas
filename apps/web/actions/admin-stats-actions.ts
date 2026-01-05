"use server";

import { supabaseAdmin } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { logger } from "@/lib/logger";

export type AdminStats = {
  totalUsers: number;
  adminUsers: number;
  subscribedUsers: number;
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
};

/**
 * Get optimized admin statistics using SQL function
 * This is much faster than fetching all users and tickets separately
 */
export async function getAdminStats(): Promise<{
  success: boolean;
  data?: AdminStats;
  error?: string;
}> {
  try {
    // Check if current user is admin
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    // Use optimized SQL function to get all stats in one query
    const { data, error } = await supabaseAdmin.rpc("get_admin_stats");

    if (error) {
      logger.error("Error fetching admin stats:", error);
      return {
        success: false,
        error: `Failed to fetch admin stats: ${error.message}`,
      };
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        data: {
          totalUsers: 0,
          adminUsers: 0,
          subscribedUsers: 0,
          totalTickets: 0,
          openTickets: 0,
          inProgressTickets: 0,
          resolvedTickets: 0,
        },
      };
    }

    const stats = data[0];
    return {
      success: true,
      data: {
        totalUsers: Number(stats.total_users) || 0,
        adminUsers: Number(stats.admin_users) || 0,
        subscribedUsers: Number(stats.subscribed_users) || 0,
        totalTickets: Number(stats.total_tickets) || 0,
        openTickets: Number(stats.open_tickets) || 0,
        inProgressTickets: Number(stats.in_progress_tickets) || 0,
        resolvedTickets: Number(stats.resolved_tickets) || 0,
      },
    };
  } catch (error) {
    logger.error("Error in getAdminStats:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
















