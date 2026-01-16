import { supabase } from "../lib/supabase";
import { ApiClient, ApiResponse } from "./client";

export type SubscriptionPlan = "free" | "pro" | "enterprise";
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing";

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  stripe_price_id: string | null;
  polar_subscription_id: string | null;
  polar_customer_id: string | null;
  polar_product_id: string | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  payment_provider: string | null;
  monthly_revenue: number | null;
  total_revenue: number | null;
  currency: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
  };
  calculatedMRR?: number; // Calculated Monthly Recurring Revenue
  calculatedARR?: number; // Calculated Annual Recurring Revenue
  planPrice?: {
    monthly: number;
    yearly: number;
    currency: string;
  };
}

export interface SubscriptionAnalytics {
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  totalRevenue: number;
  activeSubscriptions: number;
  canceledSubscriptions: number;
  churnRate: number; // Percentage
  byPlan: Array<{ plan: SubscriptionPlan; count: number; revenue: number }>;
  byStatus: Array<{ status: SubscriptionStatus; count: number }>;
  byProvider: Array<{ provider: string; count: number }>;
}

/**
 * Get all subscriptions (admin only)
 */
export async function getAllSubscriptions(): Promise<
  ApiResponse<Subscription[]>
> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    // Get all subscriptions
    const { data, error } = await supabase
      .from("subscriptions")
      .select(`
        *,
        users!subscriptions_user_id_fkey (
          id,
          email,
          name,
          avatar_url
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: null, error };
    }

    // Get all plans to calculate revenue
    const { data: plansData, error: plansError } = await supabase
      .from("plans")
      .select("plan_key, price_monthly, price_yearly, currency");

    if (plansError) {
      return { data: null, error: plansError };
    }

    // Create a map of plan_key to plan data
    const plansLookupMap = new Map<string, any>();
    (plansData || []).forEach((plan: any) => {
      plansLookupMap.set(plan.plan_key, plan);
    });

    // Helper function to calculate MRR based on plan and interval
    const calculateMRR = (sub: any): number => {
      // If monthly_revenue is set and > 0, use it
      if (sub.monthly_revenue && parseFloat(sub.monthly_revenue) > 0) {
        return parseFloat(sub.monthly_revenue);
      }

      // Otherwise, calculate from plan prices
      const planKey = sub.plan as string;
      const plan = plansLookupMap.get(planKey);
      if (!plan) return 0;

      const priceMonthly = parseFloat(plan.price_monthly || "0") || 0;
      const priceYearly = parseFloat(plan.price_yearly || "0") || 0;

      // Determine if subscription is yearly or monthly based on period length
      if (sub.current_period_start && sub.current_period_end) {
        const periodStart = new Date(sub.current_period_start);
        const periodEnd = new Date(sub.current_period_end);
        const daysDiff = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
        
        // If period is >= 300 days, it's yearly
        if (daysDiff >= 300) {
          return priceYearly / 12; // Convert yearly to monthly
        }
      }

      // Default to monthly price
      return priceMonthly;
    };

    // Map subscriptions with user info and calculated revenue
    const subscriptions: Subscription[] = (data || []).map((sub: any) => {
      const user = Array.isArray(sub.users)
        ? sub.users[0]
        : sub.users;

      const planKey = sub.plan as string;
      const plan = plansLookupMap.get(planKey);
      const calculatedMRR = calculateMRR(sub);
      const calculatedARR = calculatedMRR * 12;

      return {
        ...sub,
        user: user
          ? {
              id: sub.user_id,
              email: user.email || "",
              name: user.name || null,
              avatar_url: user.avatar_url || null,
            }
          : undefined,
        calculatedMRR,
        calculatedARR,
        planPrice: plan
          ? {
              monthly: parseFloat(plan.price_monthly || "0") || 0,
              yearly: parseFloat(plan.price_yearly || "0") || 0,
              currency: plan.currency || "EUR",
            }
          : undefined,
      };
    });

    return { data: subscriptions, error: null };
  });
}

/**
 * Get subscription by ID
 */
export async function getSubscriptionDetails(
  id: string
): Promise<ApiResponse<Subscription>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("subscriptions")
      .select(`
        *,
        users!subscriptions_user_id_fkey (
          id,
          email,
          name,
          avatar_url
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      return { data: null, error };
    }

    // Get plan prices
    const { data: plansData } = await supabase
      .from("plans")
      .select("plan_key, price_monthly, price_yearly, currency")
      .eq("plan_key", data.plan);

    const plan = plansData && plansData.length > 0 ? plansData[0] : null;

    // Helper function to calculate MRR
    const calculateMRR = (sub: any): number => {
      if (sub.monthly_revenue && parseFloat(sub.monthly_revenue) > 0) {
        return parseFloat(sub.monthly_revenue);
      }

      if (!plan) return 0;

      const priceMonthly = parseFloat(plan.price_monthly || "0") || 0;
      const priceYearly = parseFloat(plan.price_yearly || "0") || 0;

      if (sub.current_period_start && sub.current_period_end) {
        const periodStart = new Date(sub.current_period_start);
        const periodEnd = new Date(sub.current_period_end);
        const daysDiff = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff >= 300) {
          return priceYearly / 12;
        }
      }

      return priceMonthly;
    };

    const user = Array.isArray(data.users)
      ? data.users[0]
      : data.users;

    const calculatedMRR = calculateMRR(data);
    const calculatedARR = calculatedMRR * 12;

    const subscription: Subscription = {
      ...data,
      user: user
        ? {
            id: data.user_id,
            email: user.email || "",
            name: user.name || null,
            avatar_url: user.avatar_url || null,
          }
        : undefined,
      calculatedMRR,
      calculatedARR,
      planPrice: plan
        ? {
            monthly: parseFloat(plan.price_monthly || "0") || 0,
            yearly: parseFloat(plan.price_yearly || "0") || 0,
            currency: plan.currency || "EUR",
          }
        : undefined,
    };

    return { data: subscription, error: null };
  });
}

/**
 * Update subscription
 */
export async function updateSubscription(
  id: string,
  updates: Partial<{
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    cancel_at_period_end: boolean;
  }>
): Promise<ApiResponse<Subscription>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("subscriptions")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as Subscription, error: null };
  });
}

/**
 * Get subscription analytics
 */
export async function getSubscriptionAnalytics(): Promise<
  ApiResponse<SubscriptionAnalytics>
> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    // Get all subscriptions
    const { data: allSubs, error: allError } = await supabase
      .from("subscriptions")
      .select(`
        plan,
        status,
        payment_provider,
        monthly_revenue,
        total_revenue,
        current_period_start,
        current_period_end
      `);

    if (allError) {
      return { data: null, error: allError };
    }

    // Get all plans to match with subscriptions
    const { data: plansData, error: plansError } = await supabase
      .from("plans")
      .select("plan_key, price_monthly, price_yearly, currency");

    if (plansError) {
      return { data: null, error: plansError };
    }

    // Create a map of plan_key to plan data
    const plansLookupMap = new Map<string, any>();
    (plansData || []).forEach((plan: any) => {
      plansLookupMap.set(plan.plan_key, plan);
    });

    const subscriptions = allSubs || [];

    // Helper function to calculate MRR based on plan and interval
    const calculateMRR = (sub: any): number => {
      // If monthly_revenue is set and > 0, use it
      if (sub.monthly_revenue && parseFloat(sub.monthly_revenue) > 0) {
        return parseFloat(sub.monthly_revenue);
      }

      // Otherwise, calculate from plan prices
      const planKey = sub.plan as string;
      const plan = plansLookupMap.get(planKey);
      if (!plan) return 0;

      const priceMonthly = parseFloat(plan.price_monthly || "0") || 0;
      const priceYearly = parseFloat(plan.price_yearly || "0") || 0;

      // Determine if subscription is yearly or monthly based on period length
      if (sub.current_period_start && sub.current_period_end) {
        const periodStart = new Date(sub.current_period_start);
        const periodEnd = new Date(sub.current_period_end);
        const daysDiff = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
        
        // If period is >= 300 days, it's yearly
        if (daysDiff >= 300) {
          return priceYearly / 12; // Convert yearly to monthly
        }
      }

      // Default to monthly price
      return priceMonthly;
    };

    // Calculate MRR (Monthly Recurring Revenue) from active subscriptions
    const activeSubscriptions = subscriptions.filter(
      (sub: any) => sub.status === "active" || sub.status === "trialing"
    );
    
    const mrr = activeSubscriptions.reduce((sum, sub: any) => {
      return sum + calculateMRR(sub);
    }, 0);

    // Calculate ARR (Annual Recurring Revenue)
    const arr = mrr * 12;

    // Calculate total revenue (sum of all revenue, including historical)
    const totalRevenue = subscriptions.reduce(
      (sum, sub: any) => sum + (parseFloat(sub.total_revenue) || 0),
      0
    );

    // Count by plan with revenue
    const planMap = new Map<
      SubscriptionPlan,
      { count: number; revenue: number }
    >();
    activeSubscriptions.forEach((sub: any) => {
      const existing = planMap.get(sub.plan) || { count: 0, revenue: 0 };
      const subMRR = calculateMRR(sub);
      planMap.set(sub.plan, {
        count: existing.count + 1,
        revenue: existing.revenue + subMRR,
      });
    });

    // Count by status
    const statusMap = new Map<SubscriptionStatus, number>();
    subscriptions.forEach((sub: any) => {
      statusMap.set(sub.status, (statusMap.get(sub.status) || 0) + 1);
    });

    // Count by provider
    const providerMap = new Map<string, number>();
    subscriptions.forEach((sub: any) => {
      const provider = sub.payment_provider || "unknown";
      providerMap.set(provider, (providerMap.get(provider) || 0) + 1);
    });

    // Calculate churn rate
    const activeCount = subscriptions.filter(
      (sub: any) => sub.status === "active"
    ).length;
    const canceledCount = subscriptions.filter(
      (sub: any) => sub.status === "canceled"
    ).length;
    const totalCount = subscriptions.length;
    const churnRate =
      totalCount > 0 ? (canceledCount / totalCount) * 100 : 0;

    const analytics: SubscriptionAnalytics = {
      mrr,
      arr,
      totalRevenue,
      activeSubscriptions: activeCount,
      canceledSubscriptions: canceledCount,
      churnRate: Math.round(churnRate * 100) / 100,
      byPlan: Array.from(planMap.entries()).map(([plan, data]) => ({
        plan,
        count: data.count,
        revenue: data.revenue,
      })),
      byStatus: Array.from(statusMap.entries()).map(([status, count]) => ({
        status,
        count,
      })),
      byProvider: Array.from(providerMap.entries()).map(([provider, count]) => ({
        provider,
        count,
      })),
    };

    return { data: analytics, error: null };
  });
}
