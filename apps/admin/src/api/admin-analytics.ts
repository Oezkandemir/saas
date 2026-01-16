import { supabase } from "../lib/supabase";
import { ApiClient, ApiResponse } from "./client";

export interface AnalyticsData {
  userStats: {
    totalUsers: number;
    adminUsers: number;
    bannedUsers: number;
    subscribers: number;
    newUsersThisMonth: number;
    newUsersLastMonth: number;
  };
  subscriptionStats: {
    totalSubscriptions: number;
    activeSubscriptions: number;
    cancelledSubscriptions: number;
    mrr: number;
  };
  ticketStats: {
    totalTickets: number;
    openTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
  };
  pageViews: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  userGrowth: Array<{
    month: string;
    count: number;
  }>;
  featureUsage?: {
    customers: number;
    documents: number;
    qrCodes: number;
    bookings: number;
  };
  planUsage?: Array<{
    plan: string;
    users: number;
    limit: number;
    percentage: number;
  }>;
}

/**
 * Get analytics data
 */
export async function getAnalyticsData(): Promise<ApiResponse<AnalyticsData>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    // Get user stats
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("role, status, polar_subscription_id, stripe_subscription_id, created_at");

    if (usersError) {
      throw usersError;
    }

    const userList = users || [];
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const userStats = {
      totalUsers: userList.length,
      adminUsers: userList.filter((u) => u.role === "ADMIN").length,
      bannedUsers: userList.filter((u) => u.status === "banned").length,
      subscribers: userList.filter(
        (u) => u.polar_subscription_id || u.stripe_subscription_id
      ).length,
      newUsersThisMonth: userList.filter(
        (u) => new Date(u.created_at) >= thisMonth
      ).length,
      newUsersLastMonth: userList.filter(
        (u) =>
          new Date(u.created_at) >= lastMonth &&
          new Date(u.created_at) < thisMonth
      ).length,
    };

    // Get subscription stats
    const { data: subscriptions, error: subsError } = await supabase
      .from("subscriptions")
      .select("status, created_at");

    if (subsError && subsError.code !== "PGRST116") {
      // PGRST116 = table doesn't exist, which is OK
      throw subsError;
    }

    const subList = subscriptions || [];
    const subscriptionStats = {
      totalSubscriptions: subList.length,
      activeSubscriptions: subList.filter((s) => s.status === "active").length,
      cancelledSubscriptions: subList.filter((s) => s.status === "cancelled").length,
      mrr: 0, // Would need to calculate from plan prices
    };

    // Get ticket stats
    const { data: tickets, error: ticketsError } = await supabase
      .from("support_tickets")
      .select("status");

    if (ticketsError && ticketsError.code !== "PGRST116") {
      throw ticketsError;
    }

    const ticketList = tickets || [];
    const ticketStats = {
      totalTickets: ticketList.length,
      openTickets: ticketList.filter((t) => t.status === "open").length,
      inProgressTickets: ticketList.filter((t) => t.status === "in_progress").length,
      resolvedTickets: ticketList.filter((t) =>
        ["resolved", "closed"].includes(t.status)
      ).length,
    };

    // Get page views (if analytics table exists)
    const { data: pageViews, error: viewsError } = await supabase
      .from("page_views")
      .select("created_at");

    let pageViewStats = {
      total: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
    };

    if (!viewsError && pageViews) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thisWeek = new Date(today);
      thisWeek.setDate(today.getDate() - 7);
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      pageViewStats = {
        total: pageViews.length,
        today: pageViews.filter((v) => new Date(v.created_at) >= today).length,
        thisWeek: pageViews.filter((v) => new Date(v.created_at) >= thisWeek).length,
        thisMonth: pageViews.filter((v) => new Date(v.created_at) >= thisMonth).length,
      };
    }

    // Calculate user growth by month
    const userGrowthMap = new Map<string, number>();
    userList.forEach((user) => {
      const date = new Date(user.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      userGrowthMap.set(monthKey, (userGrowthMap.get(monthKey) || 0) + 1);
    });

    const userGrowth = Array.from(userGrowthMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months

    // Get feature usage
    const [customersData, documentsData, qrCodesData, bookingsData] =
      await Promise.all([
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase.from("documents").select("id", { count: "exact", head: true }),
        supabase.from("qr_codes").select("id", { count: "exact", head: true }),
        supabase.from("bookings").select("id", { count: "exact", head: true }),
      ]);

    const featureUsage = {
      customers: customersData.count || 0,
      documents: documentsData.count || 0,
      qrCodes: qrCodesData.count || 0,
      bookings: bookingsData.count || 0,
    };

    // Get plan usage (simplified - would need plan limits from config)
    const planUsage = [
      {
        plan: "free",
        users: userList.filter((u) => !u.polar_subscription_id && !u.stripe_subscription_id).length,
        limit: 1000,
        percentage: 0,
      },
      {
        plan: "enterprise",
        users: subList.filter((s: any) => s.plan === "enterprise").length,
        limit: 50,
        percentage: 0,
      },
      {
        plan: "pro",
        users: subList.filter((s: any) => s.plan === "pro").length,
        limit: 200,
        percentage: 0,
      },
    ].map((p) => ({
      ...p,
      percentage: Math.min((p.users / p.limit) * 100, 100),
    }));

    return {
      data: {
        userStats,
        subscriptionStats,
        ticketStats,
        pageViews: pageViewStats,
        userGrowth,
        featureUsage,
        planUsage,
      },
      error: null,
    };
  });
}
