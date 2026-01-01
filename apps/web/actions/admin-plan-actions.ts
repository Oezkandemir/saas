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

