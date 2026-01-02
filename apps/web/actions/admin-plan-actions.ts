"use server";

import { supabaseAdmin } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { logger } from "@/lib/logger";

export interface Plan {
  id: string;
  title: string;
  description: string | null;
  plan_key: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  stripe_product_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PlanLimit {
  id: string;
  plan_id: string;
  limit_type: string;
  limit_value: number | null;
  limit_period: string;
}

export interface PlanFeature {
  id: string;
  plan_id: string;
  feature_key: string;
  enabled: boolean;
}

export interface PlanStatistics {
  plan_id: string;
  plan_title: string;
  plan_key: string;
  user_count: number;
  mrr: number;
  arr: number;
  total_revenue: number;
}

export interface PlanMigration {
  id: string;
  user_id: string;
  from_plan_id: string | null;
  to_plan_id: string;
  migration_type: string;
  migrated_at: string;
  stripe_subscription_id: string | null;
  metadata: Record<string, any>;
}

export interface PlanUser {
  user_id: string;
  user_email: string;
  user_name: string | null;
  user_role: string;
  stripe_price_id: string | null;
  stripe_subscription_id: string | null;
  stripe_current_period_end: string | null;
  plan_id: string | null;
  plan_title: string | null;
  plan_key: string | null;
}

/**
 * Get all plans
 */
export async function getAllPlans(): Promise<{
  success: boolean;
  data?: Plan[];
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    const { data, error } = await supabaseAdmin
      .from("plans")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      logger.error("Error fetching plans:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    logger.error("Error in getAllPlans:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get plan by ID
 */
export async function getPlanById(planId: string): Promise<{
  success: boolean;
  data?: Plan;
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    const { data, error } = await supabaseAdmin
      .from("plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (error) {
      logger.error("Error fetching plan:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    logger.error("Error in getPlanById:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get plan statistics
 */
export async function getPlanStatistics(): Promise<{
  success: boolean;
  data?: PlanStatistics[];
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    const { data, error } = await supabaseAdmin.rpc("get_plan_statistics");

    if (error) {
      logger.error("Error fetching plan statistics:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    logger.error("Error in getPlanStatistics:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get plan limits
 */
export async function getPlanLimits(planId: string): Promise<{
  success: boolean;
  data?: PlanLimit[];
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    const { data, error } = await supabaseAdmin
      .from("plan_limits")
      .select("*")
      .eq("plan_id", planId)
      .order("limit_type", { ascending: true });

    if (error) {
      logger.error("Error fetching plan limits:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    logger.error("Error in getPlanLimits:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get plan features
 */
export async function getPlanFeatures(planId: string): Promise<{
  success: boolean;
  data?: PlanFeature[];
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    const { data, error } = await supabaseAdmin
      .from("plan_features")
      .select("*")
      .eq("plan_id", planId)
      .order("feature_key", { ascending: true });

    if (error) {
      logger.error("Error fetching plan features:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    logger.error("Error in getPlanFeatures:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update plan
 */
export async function updatePlan(
  planId: string,
  updates: Partial<Plan>
): Promise<{
  success: boolean;
  data?: Plan;
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    const { data, error } = await supabaseAdmin
      .from("plans")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", planId)
      .select()
      .single();

    if (error) {
      logger.error("Error updating plan:", error);
      return { success: false, error: error.message };
    }

    // Create audit log
    await supabaseAdmin.rpc("create_audit_log", {
      p_action_type: "plan_updated",
      p_resource_type: "plan",
      p_resource_id: planId,
      p_old_values: null,
      p_new_values: updates,
    });

    return { success: true, data };
  } catch (error) {
    logger.error("Error in updatePlan:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get plan migrations
 */
export async function getPlanMigrations(
  limit: number = 100
): Promise<{
  success: boolean;
  data?: PlanMigration[];
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    const { data, error } = await supabaseAdmin
      .from("plan_migrations")
      .select("*")
      .order("migrated_at", { ascending: false })
      .limit(limit);

    if (error) {
      logger.error("Error fetching plan migrations:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    logger.error("Error in getPlanMigrations:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get users by plan
 */
export async function getUsersByPlan(): Promise<{
  success: boolean;
  data?: PlanUser[];
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    // First get all users with subscriptions
    const { data: usersData, error: usersError } = await supabaseAdmin
      .from("users")
      .select("id, email, name, role, stripe_price_id, stripe_subscription_id, stripe_current_period_end")
      .not("stripe_subscription_id", "is", null)
      .order("created_at", { ascending: false });

    if (usersError) {
      logger.error("Error fetching users:", usersError);
      return { success: false, error: usersError.message };
    }

    // Then get all plans
    const { data: plansData, error: plansError } = await supabaseAdmin
      .from("plans")
      .select("id, title, plan_key, stripe_price_id_monthly, stripe_price_id_yearly");

    if (plansError) {
      logger.error("Error fetching plans:", plansError);
      return { success: false, error: plansError.message };
    }

    // Match users to plans
    const users: PlanUser[] = (usersData || []).map((user) => {
      // Find matching plan by stripe_price_id
      const matchingPlan = (plansData || []).find(
        (plan) =>
          user.stripe_price_id === plan.stripe_price_id_monthly ||
          user.stripe_price_id === plan.stripe_price_id_yearly
      );

      return {
        user_id: user.id,
        user_email: user.email,
        user_name: user.name,
        user_role: user.role,
        stripe_price_id: user.stripe_price_id,
        stripe_subscription_id: user.stripe_subscription_id,
        stripe_current_period_end: user.stripe_current_period_end,
        plan_id: matchingPlan?.id || null,
        plan_title: matchingPlan?.title || null,
        plan_key: matchingPlan?.plan_key || null,
      };
    });

    return { success: true, data: users };
  } catch (error) {
    logger.error("Error in getUsersByPlan:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}



