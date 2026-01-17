import { supabase } from "../lib/supabase";
import { ApiClient, ApiResponse } from "./client";

export interface RevenueByPeriod {
  period_start: string;
  period_end: string;
  total_revenue: number;
  subscriber_count: number;
  subscription_count: number; // Alias for subscriber_count for compatibility
  avg_revenue_per_subscriber: number;
}

export interface RevenueByPlan {
  plan: string;
  subscriber_count: number;
  total_revenue: number;
  avg_revenue_per_subscriber: number;
  mrr: number;
}

export interface SubscriptionMetrics {
  total_subscribers: number;
  active_subscribers: number;
  cancelled_subscribers: number;
  total_mrr: number;
  churn_rate: number;
  avg_revenue_per_user: number;
}

export interface RevenueAnalytics {
  revenueByPeriod: RevenueByPeriod[];
  revenueByPlan: RevenueByPlan[];
  metrics: SubscriptionMetrics;
}

/**
 * Get revenue analytics
 */
export async function getRevenueAnalytics(
  startDate?: Date,
  endDate?: Date
): Promise<ApiResponse<RevenueAnalytics>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const end = endDate || new Date();
    const start =
      startDate || new Date(end.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);

    // Get subscriptions with all needed fields
    const { data: subscriptions, error: subsError } = await supabase
      .from("subscriptions")
      .select("id, plan, status, created_at, updated_at, monthly_revenue, total_revenue, currency, current_period_start, current_period_end");

    if (subsError) {
      if (subsError.code === "PGRST116" || subsError.message?.includes("does not exist")) {
        console.warn("Subscriptions table does not exist yet. Returning empty data.");
        return {
          data: {
            revenueByPeriod: [],
            revenueByPlan: [],
            metrics: {
              total_subscribers: 0,
              active_subscribers: 0,
              cancelled_subscribers: 0,
              total_mrr: 0,
              churn_rate: 0,
              avg_revenue_per_user: 0,
            },
          },
          error: null,
        };
      }
      console.error("Error fetching subscriptions:", subsError);
      return { data: null, error: subsError };
    }

    // Get plans to get pricing information
    const { data: plans, error: plansError } = await supabase
      .from("plans")
      .select("plan_key, price_monthly, price_yearly, currency");

    if (plansError && plansError.code !== "PGRST116") {
      console.warn("Error fetching plans:", plansError);
      // Continue without plans - will use monthly_revenue from subscriptions
    }

    const subList = subscriptions || [];
    const plansList = plans || [];
    
    // Create a map of plan_key to price
    const planPriceMap = new Map<string, { monthly: number; yearly: number; currency: string }>();
    plansList.forEach((plan: any) => {
      planPriceMap.set(plan.plan_key, {
        monthly: parseFloat(plan.price_monthly || "0") || 0,
        yearly: parseFloat(plan.price_yearly || "0") || 0,
        currency: plan.currency || "EUR",
      });
    });

    // Helper function to get revenue for a subscription
    const getSubscriptionRevenue = (sub: any): number => {
      // Use monthly_revenue if available and > 0
      if (sub.monthly_revenue && parseFloat(sub.monthly_revenue) > 0) {
        return parseFloat(sub.monthly_revenue);
      }
      
      // Otherwise, get price from plan
      const planPrices = planPriceMap.get(sub.plan);
      if (planPrices) {
        return planPrices.monthly;
      }
      
      return 0;
    };

    const activeSubs = subList.filter((s) => s.status === "active");
    const cancelledSubs = subList.filter((s) => s.status === "cancelled");

    // Calculate total MRR from active subscriptions
    const totalMRR = activeSubs.reduce((sum, sub) => {
      return sum + getSubscriptionRevenue(sub);
    }, 0);

    // Calculate average revenue per user
    const avgRevenuePerUser = activeSubs.length > 0 ? totalMRR / activeSubs.length : 0;

    // Calculate metrics
    const metrics: SubscriptionMetrics = {
      total_subscribers: subList.length,
      active_subscribers: activeSubs.length,
      cancelled_subscribers: cancelledSubs.length,
      total_mrr: totalMRR,
      churn_rate:
        subList.length > 0
          ? (cancelledSubs.length / subList.length) * 100
          : 0,
      avg_revenue_per_user: avgRevenuePerUser,
    };

    // Group by period (monthly)
    const revenueByPeriodMap = new Map<string, RevenueByPeriod>();
    const periodStart = new Date(start);
    const periodEnd = new Date(end);

    // Initialize periods
    for (
      let d = new Date(periodStart);
      d <= periodEnd;
      d.setMonth(d.getMonth() + 1)
    ) {
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const key = `${monthStart.toISOString().split("T")[0]}`;

      revenueByPeriodMap.set(key, {
        period_start: monthStart.toISOString(),
        period_end: monthEnd.toISOString(),
        total_revenue: 0,
        subscriber_count: 0,
        subscription_count: 0,
        avg_revenue_per_subscriber: 0,
      });
    }

    // Calculate revenue by period
    subList.forEach((sub: any) => {
      const subCreatedAt = new Date(sub.created_at);
      const subRevenue = getSubscriptionRevenue(sub);
      
      // For each period, check if subscription was active
      revenueByPeriodMap.forEach((period, key) => {
        const periodStartDate = new Date(period.period_start);
        const periodEndDate = new Date(period.period_end);
        
        // If subscription was active during this period
        if (
          sub.status === "active" &&
          subCreatedAt <= periodEndDate &&
          (!sub.current_period_end || new Date(sub.current_period_end) >= periodStartDate)
        ) {
          period.subscriber_count += 1;
          period.subscription_count += 1;
          period.total_revenue += subRevenue;
        }
      });
    });

    // Calculate averages
    revenueByPeriodMap.forEach((period) => {
      period.avg_revenue_per_subscriber =
        period.subscriber_count > 0
          ? period.total_revenue / period.subscriber_count
          : 0;
    });

    // Group by plan
    const revenueByPlanMap = new Map<string, RevenueByPlan>();
    
    activeSubs.forEach((sub: any) => {
      const planKey = sub.plan || "unknown";
      const subRevenue = getSubscriptionRevenue(sub);
      
      if (!revenueByPlanMap.has(planKey)) {
        revenueByPlanMap.set(planKey, {
          plan: planKey,
          subscriber_count: 0,
          total_revenue: 0,
          avg_revenue_per_subscriber: 0,
          mrr: 0,
        });
      }
      
      const planData = revenueByPlanMap.get(planKey)!;
      planData.subscriber_count += 1;
      planData.total_revenue += subRevenue;
      planData.mrr += subRevenue;
    });

    // Calculate averages for plans
    revenueByPlanMap.forEach((plan) => {
      plan.avg_revenue_per_subscriber =
        plan.subscriber_count > 0
          ? plan.total_revenue / plan.subscriber_count
          : 0;
    });

    const revenueByPeriod = Array.from(revenueByPeriodMap.values());
    const revenueByPlan = Array.from(revenueByPlanMap.values());

    return {
      data: {
        revenueByPeriod,
        revenueByPlan,
        metrics,
      },
      error: null,
    };
  });
}
