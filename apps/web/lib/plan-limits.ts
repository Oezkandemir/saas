import { supabaseAdmin } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { getSupabaseServer } from "@/lib/supabase-server";

export type LimitType =
  | "customers"
  | "qr_codes"
  | "documents"
  | "api_calls"
  | "storage"
  | "team_members"
  | "webhooks"
  | "custom_domains"
  | "email_sends";

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  limitType: LimitType;
  message?: string;
}

/**
 * Get the limit for a specific resource based on the user's plan from database
 */
async function getPlanLimitFromDB(
  planId: string,
  limitType: LimitType,
): Promise<number | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("plan_limits")
      .select("limit_value")
      .eq("plan_id", planId)
      .eq("limit_type", limitType)
      .single();

    if (error || !data) {
      return null;
    }

    return data.limit_value === null ? Infinity : Number(data.limit_value);
  } catch (error) {
    logger.error("Error fetching plan limit from DB:", error);
    return null;
  }
}

/**
 * Get plan ID from plan key
 */
async function getPlanIdFromKey(planKey: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("plans")
      .select("id")
      .eq("plan_key", planKey.toLowerCase())
      .single();

    if (error || !data) {
      return null;
    }

    return data.id;
  } catch (error) {
    logger.error("Error fetching plan ID from key:", error);
    return null;
  }
}

/**
 * Get the limit for a specific resource based on the user's plan
 * Falls back to hardcoded limits if database lookup fails
 */
async function getPlanLimit(
  planTitle: string,
  planKey: string,
  limitType: LimitType,
): Promise<number> {
  // Try to get from database first
  const planId = await getPlanIdFromKey(planKey);
  if (planId) {
    const dbLimit = await getPlanLimitFromDB(planId, limitType);
    if (dbLimit !== null) {
      return dbLimit;
    }
  }

  // Fallback to hardcoded limits
  if (planTitle === "Free" || planKey === "free") {
    switch (limitType) {
      case "customers":
        return 3;
      case "qr_codes":
        return 3;
      case "documents":
        return 3;
      case "api_calls":
        return 100;
      case "storage":
        return 100; // MB
      case "team_members":
        return 1;
      case "webhooks":
        return 0;
      case "custom_domains":
        return 0;
      case "email_sends":
        return 100;
      default:
        return Infinity;
    }
  }

  // Pro plan fallback limits
  if (planTitle === "Pro" || planKey === "pro") {
    switch (limitType) {
      case "api_calls":
        return 10000;
      case "storage":
        return 10240; // 10 GB in MB
      case "team_members":
        return 5;
      case "webhooks":
        return 10;
      case "custom_domains":
        return 1;
      case "email_sends":
        return 10000;
      default:
        return Infinity;
    }
  }

  // Enterprise plan has unlimited for most
  return Infinity;
}

/**
 * Check if user has reached the limit for a specific resource
 */
export async function checkPlanLimit(
  userId: string,
  limitType: LimitType,
): Promise<LimitCheckResult> {
  try {
    const subscriptionPlan = await getUserSubscriptionPlan(userId);
    const planKey = subscriptionPlan.title.toLowerCase() as string;
    const limit = await getPlanLimit(
      subscriptionPlan.title,
      planKey,
      limitType,
    );

    // Unlimited plans don't need checking
    if (limit === Infinity) {
      return {
        allowed: true,
        current: 0,
        limit: Infinity,
        limitType,
      };
    }

    const supabase = await getSupabaseServer();
    let current = 0;

    switch (limitType) {
      case "customers": {
        const { count, error } = await supabase
          .from("customers")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        if (error) {
          logger.error("Error counting customers", error);
          // Allow creation if we can't count (fail open)
          return {
            allowed: true,
            current: 0,
            limit,
            limitType,
          };
        }

        current = count || 0;
        break;
      }

      case "qr_codes": {
        // QR codes are the same as customers (each customer has one QR code)
        const { count, error } = await supabase
          .from("customers")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .not("qr_code", "is", null);

        if (error) {
          logger.error("Error counting QR codes", error);
          return {
            allowed: true,
            current: 0,
            limit,
            limitType,
          };
        }

        current = count || 0;
        break;
      }

      case "documents": {
        // Count documents created this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const { count, error } = await supabase
          .from("documents")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", startOfMonth.toISOString());

        if (error) {
          logger.error("Error counting documents", error);
          return {
            allowed: true,
            current: 0,
            limit,
            limitType,
          };
        }

        current = count || 0;
        break;
      }

      case "api_calls": {
        // Get API calls from usage_metrics for current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const { data, error } = await supabase
          .from("usage_metrics")
          .select("metric_value")
          .eq("user_id", userId)
          .eq("metric_type", "api_calls")
          .gte("metric_period_start", startOfMonth.toISOString())
          .lt("metric_period_end", endOfMonth.toISOString());

        if (error) {
          logger.error("Error counting API calls", error);
          return {
            allowed: true,
            current: 0,
            limit,
            limitType,
          };
        }

        current =
          data?.reduce((sum, m) => sum + Number(m.metric_value || 0), 0) || 0;
        break;
      }

      case "storage": {
        // Get storage usage from usage_metrics (lifetime)
        const { data, error } = await supabase
          .from("usage_metrics")
          .select("metric_value")
          .eq("user_id", userId)
          .eq("metric_type", "storage");

        if (error) {
          logger.error("Error counting storage", error);
          return {
            allowed: true,
            current: 0,
            limit,
            limitType,
          };
        }

        current =
          data?.reduce((sum, m) => sum + Number(m.metric_value || 0), 0) || 0;
        break;
      }

      case "team_members": {
        // Count team members (if teams table exists)
        // For now, return 1 as default
        current = 1;
        break;
      }

      case "webhooks": {
        // Count webhooks (if webhooks table exists)
        const { count, error } = await supabase
          .from("webhooks")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        if (error) {
          // Table might not exist, default to 0
          current = 0;
        } else {
          current = count || 0;
        }
        break;
      }

      case "email_sends": {
        // Get email sends from usage_metrics for current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const { data, error } = await supabase
          .from("usage_metrics")
          .select("metric_value")
          .eq("user_id", userId)
          .eq("metric_type", "email_sends")
          .gte("metric_period_start", startOfMonth.toISOString())
          .lt("metric_period_end", endOfMonth.toISOString());

        if (error) {
          logger.error("Error counting email sends", error);
          return {
            allowed: true,
            current: 0,
            limit,
            limitType,
          };
        }

        current =
          data?.reduce((sum, m) => sum + Number(m.metric_value || 0), 0) || 0;
        break;
      }
    }

    const allowed = current < limit;

    let message: string | undefined;
    if (!allowed) {
      switch (limitType) {
        case "customers":
          message = `Sie haben das Limit von ${limit} Kunden erreicht. Bitte upgraden Sie auf einen Pro- oder Enterprise-Plan, um unbegrenzt Kunden anzulegen.`;
          break;
        case "qr_codes":
          message = `Sie haben das Limit von ${limit} QR-Codes erreicht. Bitte upgraden Sie auf einen Pro- oder Enterprise-Plan, um unbegrenzt QR-Codes zu erstellen.`;
          break;
        case "documents":
          message = `Sie haben das monatliche Limit von ${limit} Dokumenten erreicht. Bitte upgraden Sie auf einen Pro- oder Enterprise-Plan, um unbegrenzt Dokumente zu erstellen.`;
          break;
      }
    }

    return {
      allowed,
      current,
      limit,
      limitType,
      message,
    };
  } catch (error) {
    logger.error("Error checking plan limit", error);
    // Fail open - allow creation if we can't check limits
    return {
      allowed: true,
      current: 0,
      limit: Infinity,
      limitType,
    };
  }
}

/**
 * Throw an error if the user has reached the limit
 */
export async function enforcePlanLimit(
  userId: string,
  limitType: LimitType,
): Promise<void> {
  const result = await checkPlanLimit(userId, limitType);

  if (!result.allowed && result.message) {
    throw new Error(result.message);
  }
}
