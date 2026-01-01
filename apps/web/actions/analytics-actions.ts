"use server";

import { User } from "@supabase/supabase-js";

import { supabaseAdmin } from "@/lib/db-admin";
import { getCurrentUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

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
  // Enhanced fields
  country?: string | null;
  city?: string | null;
  region?: string | null;
  timezone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  ipAddress?: string | null;
  browserVersion?: string | null;
  osVersion?: string | null;
  screenWidth?: number | null;
  screenHeight?: number | null;
  viewportWidth?: number | null;
  viewportHeight?: number | null;
  pixelRatio?: number | null;
  language?: string | null;
  isMobile?: boolean | null;
  isTablet?: boolean | null;
  isDesktop?: boolean | null;
  connectionType?: string | null;
  isOnline?: boolean | null;
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
  // Enhanced fields
  country?: string | null;
  city?: string | null;
  region?: string | null;
  ipAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
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
      // Use optimized SQL aggregation instead of fetching all users
      const { data, error } = await supabaseAdmin.rpc("get_user_stats_aggregated");

      if (error) {
        // Fallback to basic query if function doesn't exist
        logger.warn("get_user_stats_aggregated function not found, using fallback");
        const { data: users, error: usersError } = await supabaseAdmin
          .from("users")
          .select("role, status, stripe_subscription_id");

        if (usersError) throw usersError;

        const totalUsers = users.length;
        const adminCount = users.filter((user) => user.role === "ADMIN").length;
        const bannedCount = users.filter((user) => user.status === "banned").length;
        const subscribersCount = users.filter(
          (user) => user.stripe_subscription_id !== null,
        ).length;

        return {
          totalUsers,
          adminCount,
          bannedCount,
          subscribersCount,
        };
      }

      if (!data || data.length === 0) {
        return {
          totalUsers: 0,
          adminCount: 0,
          bannedCount: 0,
          subscribersCount: 0,
        };
      }

      const stats = data[0];
      return {
        totalUsers: Number(stats.total_users) || 0,
        adminCount: Number(stats.admin_count) || 0,
        bannedCount: Number(stats.banned_count) || 0,
        subscribersCount: Number(stats.subscribers_count) || 0,
      };
    };

    const getUserGrowth = async () => {
      // Use SQL aggregation for better performance
      const { data, error } = await supabaseAdmin.rpc("get_user_growth_by_month");

      if (error) {
        // Fallback to basic query if function doesn't exist
        logger.warn("get_user_growth_by_month function not found, using fallback");
        const { data: users, error: usersError } = await supabaseAdmin
          .from("users")
          .select("created_at");

        if (usersError) throw usersError;

        const userGrowthByMonth: Record<string, number> = {};

        users.forEach((user) => {
          const date = new Date(user.created_at);
          const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

          if (!userGrowthByMonth[month]) {
            userGrowthByMonth[month] = 0;
          }

          userGrowthByMonth[month]++;
        });

        return userGrowthByMonth;
      }

      // Convert array result to object format
      const userGrowthByMonth: Record<string, number> = {};
      if (data) {
        data.forEach((row: { month: string; count: number }) => {
          userGrowthByMonth[row.month] = Number(row.count) || 0;
        });
      }

      return userGrowthByMonth;
    };

    const getTicketStats = async () => {
      try {
        // Use optimized SQL aggregation
        const { data, error } = await supabaseAdmin.rpc("get_ticket_stats_aggregated");

        if (error) {
          // Fallback to basic query if function doesn't exist
          logger.warn("get_ticket_stats_aggregated function not found, using fallback");
          const { data: tickets, error: ticketsError } = await supabaseAdmin
            .from("support_tickets")
            .select("status");

          if (ticketsError) {
            logger.warn("Error fetching ticket stats:", ticketsError);
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

          tickets?.forEach((ticket) => {
            const status = ticket.status.toLowerCase().replace(" ", "_");
            if (ticketStats[status] !== undefined) {
              ticketStats[status]++;
            }
          });

          return ticketStats;
        }

        if (!data || data.length === 0) {
          return {
            open: 0,
            in_progress: 0,
            resolved: 0,
            closed: 0,
          };
        }

        const stats = data[0];
        return {
          open: Number(stats.open) || 0,
          in_progress: Number(stats.in_progress) || 0,
          resolved: Number(stats.resolved) || 0,
          closed: Number(stats.closed) || 0,
        };
      } catch (error) {
        logger.warn("Error in getTicketStats:", error);
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
        // Use login_history table instead of auth_events
        const { data, error } = await supabaseAdmin
          .from("login_history")
          .select("user_id, created_at, ip_address, user_agent")
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) {
          logger.warn(
            "Error fetching login history (table may not exist):",
            error,
          );
          return [];
        }

        // Get user emails for the logins
        if (!data || data.length === 0) return [];

        const userIds = data.map((login) => login.user_id).filter(Boolean);
        if (userIds.length === 0) return [];

        const { data: users, error: usersError } = await supabaseAdmin
          .from("users")
          .select("id, email")
          .in("id", userIds);

        if (usersError) {
          logger.warn("Error fetching user emails:", usersError);
          return data.map((login) => ({
            type: "login",
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
          type: "login",
          userId: login.user_id,
          email: userMap[login.user_id] || "Unknown",
          timestamp: login.created_at,
        }));
      } catch (error) {
        logger.warn("Error in getRecentLogins:", error);
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
    logger.error("Error in getAnalyticsData:", error);
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
      logger.warn("Error calling get_detailed_analytics function:", error);
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

    // Parse JSONB data from function result
    if (!data || data.length === 0) {
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

    const result = data[0];
    return {
      success: true,
      data: {
        page_view_stats: Array.isArray(result.page_view_stats) 
          ? result.page_view_stats 
          : [],
        user_engagement: Array.isArray(result.user_engagement)
          ? result.user_engagement
          : [],
        device_stats: Array.isArray(result.device_stats)
          ? result.device_stats
          : [],
        browser_stats: Array.isArray(result.browser_stats)
          ? result.browser_stats
          : [],
        referrer_stats: Array.isArray(result.referrer_stats)
          ? result.referrer_stats
          : [],
      },
    };
  } catch (error) {
    logger.error("Error in getDetailedAnalytics:", error);
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
 * Record a page view with enhanced tracking
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
        // Enhanced fields
        country: pageViewData.country,
        city: pageViewData.city,
        region: pageViewData.region,
        timezone: pageViewData.timezone,
        latitude: pageViewData.latitude,
        longitude: pageViewData.longitude,
        ip_address: pageViewData.ipAddress,
        browser_version: pageViewData.browserVersion,
        os_version: pageViewData.osVersion,
        screen_width: pageViewData.screenWidth,
        screen_height: pageViewData.screenHeight,
        viewport_width: pageViewData.viewportWidth,
        viewport_height: pageViewData.viewportHeight,
        pixel_ratio: pageViewData.pixelRatio,
        language: pageViewData.language,
        is_mobile: pageViewData.isMobile,
        is_tablet: pageViewData.isTablet,
        is_desktop: pageViewData.isDesktop,
        connection_type: pageViewData.connectionType,
        is_online: pageViewData.isOnline,
      },
    ]);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    logger.error("Error recording page view:", error);
    return { success: false, error: "Failed to record page view" };
  }
}

/**
 * Track a user interaction (click, form submission, etc.) with enhanced data
 */
export async function trackUserInteraction(
  interactionData: UserInteractionData,
) {
  try {
    const supabase = await createClient();

    const coordinates = 
      interactionData.latitude && interactionData.longitude
        ? `(${interactionData.longitude},${interactionData.latitude})`
        : null;

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
        // Enhanced fields
        country: interactionData.country,
        city: interactionData.city,
        region: interactionData.region,
        ip_address: interactionData.ipAddress,
        coordinates: coordinates,
      },
    ]);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    logger.error("Error tracking user interaction:", error);
    return { success: false, error: "Failed to track user interaction" };
  }
}

/**
 * Get real-time active users
 */
export async function getRealtimeActiveUsers() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const { data, error } = await supabaseAdmin.rpc("get_realtime_active_users");

    if (error) {
      logger.warn("Error fetching realtime active users:", error);
      return { success: true, data: [] };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    logger.error("Error in getRealtimeActiveUsers:", error);
    return { success: false, error: "Failed to fetch active users" };
  }
}

/**
 * Get real-time page views
 */
export async function getRealtimePageViews() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const { data, error } = await supabaseAdmin.rpc("get_realtime_page_views");

    if (error) {
      logger.warn("Error fetching realtime page views:", error);
      return { success: true, data: [] };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    logger.error("Error in getRealtimePageViews:", error);
    return { success: false, error: "Failed to fetch page views" };
  }
}

/**
 * Get geolocation statistics
 */
export async function getGeolocationStats(days = 30) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const { data, error } = await supabaseAdmin.rpc("get_geolocation_stats", {
      p_days: days,
    });

    if (error) {
      logger.warn("Error fetching geolocation stats:", error);
      return { success: true, data: [] };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    logger.error("Error in getGeolocationStats:", error);
    return { success: false, error: "Failed to fetch geolocation stats" };
  }
}

/**
 * Get device statistics
 */
export async function getDeviceStatistics(days = 30) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const { data, error } = await supabaseAdmin.rpc("get_device_statistics", {
      p_days: days,
    });

    if (error) {
      logger.warn("Error fetching device statistics:", error);
      return { success: true, data: [] };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    logger.error("Error in getDeviceStatistics:", error);
    return { success: false, error: "Failed to fetch device statistics" };
  }
}

/**
 * Get user activity timeline
 */
export async function getUserActivityTimeline(hours = 24) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const { data, error } = await supabaseAdmin.rpc("get_user_activity_timeline", {
      p_hours: hours,
    });

    if (error) {
      logger.warn("Error fetching user activity timeline:", error);
      return { success: true, data: [] };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    logger.error("Error in getUserActivityTimeline:", error);
    return { success: false, error: "Failed to fetch activity timeline" };
  }
}
