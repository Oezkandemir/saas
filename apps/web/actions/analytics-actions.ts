"use server";

import { User } from "@supabase/supabase-js";

import { supabaseAdmin } from "@/lib/db-admin";
import { getCurrentUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

interface AuthUser extends User {
  banned?: boolean;
  last_sign_in_at?: string;
}

// Types for tracking data
export interface PageViewData {
  userId?: string | null;
  sessionId: string;
  pagePath: string;
  pageTitle?: string | null;
  referrer?: string | null;
  duration?: number | null;
  browser?: string | null;
  os?: string | null;
  deviceType?: string | null;
  screenSize?: string | null;
}

export interface UserInteractionData {
  userId?: string | null;
  sessionId: string;
  pagePath: string;
  interactionType: string;
  elementId?: string;
  elementClass?: string;
  elementText?: string;
  formData?: Record<string, string>;
}

/**
 * Get analytics data for the admin dashboard
 * Returns various statistics about users, subscriptions, and support tickets
 */
export async function getAnalyticsData() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const getUserStats = async () => {
      const { data, error } = await supabaseAdmin.from("users").select("*");

      if (error) throw error;

      const totalUsers = data.length;
      const adminCount = data.filter((user) => user.role === "ADMIN").length;
      const bannedCount = data.filter(
        (user) => user.status === "banned",
      ).length;
      const subscribersCount = data.filter(
        (user) => user.stripe_subscription_id !== null,
      ).length;

      return {
        totalUsers,
        adminCount,
        bannedCount,
        subscribersCount,
      };
    };

    const getUserGrowth = async () => {
      const { data, error } = await supabaseAdmin
        .from("users")
        .select("created_at");

      if (error) throw error;

      const userGrowthByMonth: Record<string, number> = {};

      data.forEach((user) => {
        const date = new Date(user.created_at);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

        if (!userGrowthByMonth[month]) {
          userGrowthByMonth[month] = 0;
        }

        userGrowthByMonth[month]++;
      });

      return userGrowthByMonth;
    };

    const getTicketStats = async () => {
      try {
        const { data, error } = await supabaseAdmin
          .from("tickets")
          .select("status");

        if (error) {
          console.warn(
            "Error fetching ticket stats (table may not exist):",
            error,
          );
          // Return default empty stats if table doesn't exist or other error
          return {
            open: 0,
            in_progress: 0,
            resolved: 0,
            closed: 0,
          };
        }

        const ticketStats: Record<string, number> = {
          open: 0,
          in_progress: 0,
          resolved: 0,
          closed: 0,
        };

        data.forEach((ticket) => {
          const status = ticket.status.toLowerCase().replace(" ", "_");
          if (ticketStats[status] !== undefined) {
            ticketStats[status]++;
          }
        });

        return ticketStats;
      } catch (error) {
        console.warn("Error in getTicketStats:", error);
        // Return default empty stats on error
        return {
          open: 0,
          in_progress: 0,
          resolved: 0,
          closed: 0,
        };
      }
    };

    const getRecentLogins = async () => {
      try {
        const { data, error } = await supabaseAdmin
          .from("auth_events")
          .select("*")
          .eq("type", "login")
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) {
          console.warn(
            "Error fetching auth events (table may not exist):",
            error,
          );
          return [];
        }

        // Get user emails for the logins
        if (!data || data.length === 0) return [];

        const userIds = data.map((login) => login.user_id);
        const { data: users, error: usersError } = await supabaseAdmin
          .from("users")
          .select("id, email")
          .in("id", userIds);

        if (usersError) {
          console.warn("Error fetching user emails:", usersError);
          return data.map((login) => ({
            type: login.type,
            userId: login.user_id,
            email: "Unknown",
            timestamp: login.created_at,
          }));
        }

        const userMap = users.reduce(
          (acc, user) => {
            acc[user.id] = user.email;
            return acc;
          },
          {} as Record<string, string>,
        );

        return data.map((login) => ({
          type: login.type,
          userId: login.user_id,
          email: userMap[login.user_id] || "Unknown",
          timestamp: login.created_at,
        }));
      } catch (error) {
        console.warn("Error in getRecentLogins:", error);
        return [];
      }
    };

    const getRecentSubscriptions = async () => {
      const { data, error } = await supabaseAdmin
        .from("users")
        .select("id, email, stripe_subscription_id, stripe_current_period_end")
        .not("stripe_subscription_id", "is", null)
        .order("stripe_current_period_end", { ascending: true })
        .limit(5);

      if (error) throw error;

      return data;
    };

    // Get detailed analytics data
    const detailedData = await getDetailedAnalytics(30);

    const [
      userStats,
      userGrowthByMonth,
      ticketStats,
      recentLogins,
      recentSubscriptions,
    ] = await Promise.all([
      getUserStats(),
      getUserGrowth(),
      getTicketStats(),
      getRecentLogins(),
      getRecentSubscriptions(),
    ]);

    return {
      success: true,
      data: {
        ...userStats,
        userGrowthByMonth,
        ticketStats,
        recentLogins,
        recentSubscriptions,
        detailedAnalytics: detailedData.success ? detailedData.data : null,
      },
    };
  } catch (error) {
    console.error("Error in getAnalyticsData:", error);
    return {
      success: false,
      error: "Failed to fetch analytics data",
    };
  }
}

/**
 * Get detailed analytics data for the admin dashboard
 */
export async function getDetailedAnalytics(daysRange = 30) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Try to call the function - if it doesn't exist, it will error
    const { data, error } = await supabaseAdmin.rpc("get_detailed_analytics", {
      p_days_range: daysRange,
    });

    if (error) {
      console.warn("Error calling get_detailed_analytics function:", error);
      // Return default empty data instead of error
      return {
        success: true,
        data: {
          page_view_stats: [],
          user_engagement: [],
          device_stats: [],
          browser_stats: [],
          referrer_stats: [],
        },
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error in getDetailedAnalytics:", error);
    // Return success with empty data to prevent UI from breaking
    return {
      success: true,
      data: {
        page_view_stats: [],
        user_engagement: [],
        device_stats: [],
        browser_stats: [],
        referrer_stats: [],
      },
    };
  }
}

/**
 * Record a page view
 */
export async function recordPageView(pageViewData: PageViewData) {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("page_views").insert([
      {
        user_id: pageViewData.userId,
        session_id: pageViewData.sessionId,
        page_path: pageViewData.pagePath,
        page_title: pageViewData.pageTitle,
        referrer: pageViewData.referrer,
        duration_seconds: pageViewData.duration,
        browser: pageViewData.browser,
        os: pageViewData.os,
        device_type: pageViewData.deviceType,
        screen_size: pageViewData.screenSize,
      },
    ]);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error recording page view:", error);
    return { success: false, error: "Failed to record page view" };
  }
}

/**
 * Track a user interaction (click, form submission, etc.)
 */
export async function trackUserInteraction(
  interactionData: UserInteractionData,
) {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("user_interactions").insert([
      {
        user_id: interactionData.userId,
        session_id: interactionData.sessionId,
        page_path: interactionData.pagePath,
        interaction_type: interactionData.interactionType,
        element_id: interactionData.elementId,
        element_class: interactionData.elementClass,
        element_text: interactionData.elementText,
        form_data: interactionData.formData,
      },
    ]);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error tracking user interaction:", error);
    return { success: false, error: "Failed to track user interaction" };
  }
}
