"use server";

import { getCurrentUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type RevenueByPeriod = {
  period_start: string;
  period_end: string;
  total_revenue: number;
  subscriber_count: number;
  avg_revenue_per_subscriber: number;
};

export type RevenueByPlan = {
  plan: string;
  subscriber_count: number;
  total_revenue: number;
  avg_revenue_per_subscriber: number;
  mrr: number;
};

export type SubscriptionMetrics = {
  total_subscribers: number;
  active_subscribers: number;
  cancelled_subscribers: number;
  total_mrr: number;
  churn_rate: number;
  avg_revenue_per_user: number;
};

export type RevenueAnalytics = {
  revenueByPeriod: RevenueByPeriod[];
  revenueByPlan: RevenueByPlan[];
  metrics: SubscriptionMetrics;
};

/**
 * Get comprehensive revenue analytics
 */
export async function getRevenueAnalytics(
  startDate?: Date,
  endDate?: Date,
): Promise<ActionResult<RevenueAnalytics>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);

    const [byPeriod, byPlan, metrics] = await Promise.all([
      getRevenueByPeriod(start, end),
      getRevenueByPlan(start, end),
      getSubscriptionMetrics(),
    ]);

    if (!byPeriod.success || !byPlan.success || !metrics.success) {
      return {
        success: false,
        error: "Failed to fetch revenue analytics",
      };
    }

    return {
      success: true,
      data: {
        revenueByPeriod: byPeriod.data || [],
        revenueByPlan: byPlan.data || [],
        metrics: metrics.data || {
          total_subscribers: 0,
          active_subscribers: 0,
          cancelled_subscribers: 0,
          total_mrr: 0,
          churn_rate: 0,
          avg_revenue_per_user: 0,
        },
      },
    };
  } catch (error) {
    logger.error("Error in getRevenueAnalytics:", error);
    return {
      success: false,
      error: "Failed to fetch revenue analytics",
    };
  }
}

/**
 * Get revenue by time period
 */
export async function getRevenueByPeriod(
  startDate: Date,
  endDate: Date,
  groupBy: "day" | "week" | "month" | "year" = "month",
): Promise<ActionResult<RevenueByPeriod[]>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_revenue_by_period", {
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString(),
      p_group_by: groupBy,
    });

    if (error) {
      logger.error("Error fetching revenue by period:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: (data || []).map((item) => ({
        period_start: item.period_start,
        period_end: item.period_end,
        total_revenue: parseFloat(item.total_revenue || "0"),
        subscriber_count: parseInt(item.subscriber_count || "0", 10),
        avg_revenue_per_subscriber: parseFloat(
          item.avg_revenue_per_subscriber || "0",
        ),
      })) as RevenueByPeriod[],
    };
  } catch (error) {
    logger.error("Error in getRevenueByPeriod:", error);
    return {
      success: false,
      error: "Failed to fetch revenue by period",
    };
  }
}

/**
 * Get revenue by subscription plan
 */
export async function getRevenueByPlan(
  startDate: Date,
  endDate: Date,
): Promise<ActionResult<RevenueByPlan[]>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_revenue_by_plan", {
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString(),
    });

    if (error) {
      logger.error("Error fetching revenue by plan:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: (data || []).map((item) => ({
        plan: item.plan,
        subscriber_count: parseInt(item.subscriber_count || "0", 10),
        total_revenue: parseFloat(item.total_revenue || "0"),
        avg_revenue_per_subscriber: parseFloat(
          item.avg_revenue_per_subscriber || "0",
        ),
        mrr: parseFloat(item.mrr || "0"),
      })) as RevenueByPlan[],
    };
  } catch (error) {
    logger.error("Error in getRevenueByPlan:", error);
    return {
      success: false,
      error: "Failed to fetch revenue by plan",
    };
  }
}

/**
 * Get subscription metrics
 */
export async function getSubscriptionMetrics(): Promise<
  ActionResult<SubscriptionMetrics>
> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_subscription_metrics");

    if (error) {
      logger.error("Error fetching subscription metrics:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        data: {
          total_subscribers: 0,
          active_subscribers: 0,
          cancelled_subscribers: 0,
          total_mrr: 0,
          churn_rate: 0,
          avg_revenue_per_user: 0,
        },
      };
    }

    const metrics = data[0];

    return {
      success: true,
      data: {
        total_subscribers: parseInt(metrics.total_subscribers || "0", 10),
        active_subscribers: parseInt(metrics.active_subscribers || "0", 10),
        cancelled_subscribers: parseInt(
          metrics.cancelled_subscribers || "0",
          10,
        ),
        total_mrr: parseFloat(metrics.total_mrr || "0"),
        churn_rate: parseFloat(metrics.churn_rate || "0"),
        avg_revenue_per_user: parseFloat(metrics.avg_revenue_per_user || "0"),
      },
    };
  } catch (error) {
    logger.error("Error in getSubscriptionMetrics:", error);
    return {
      success: false,
      error: "Failed to fetch subscription metrics",
    };
  }
}
















