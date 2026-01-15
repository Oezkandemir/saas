import { logger } from "@/lib/logger";
import { checkPlanLimit, type LimitType } from "@/lib/plan-limits";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { getSupabaseServer } from "@/lib/supabase-server";

export interface UsageBillingConfig {
  enabled: boolean;
  overageRate: number; // Price per unit over limit
  billingThreshold: number; // Percentage of limit before billing starts
}

export interface OverageCharge {
  limitType: LimitType;
  limit: number;
  usage: number;
  overage: number;
  charge: number;
}

/**
 * Get usage billing configuration for a plan
 */
export async function getUsageBillingConfig(
  userId: string
): Promise<UsageBillingConfig | null> {
  try {
    const plan = await getUserSubscriptionPlan(userId);

    // Only Pro and Enterprise plans support overage billing
    if (plan.title === "Free") {
      return null;
    }

    // Default configuration
    return {
      enabled: true,
      overageRate: 0.01, // €0.01 per unit over limit
      billingThreshold: 100, // Bill when over 100% of limit
    };
  } catch (error) {
    logger.error("Error getting usage billing config:", error);
    return null;
  }
}

/**
 * Calculate overage charges for a user
 */
export async function calculateOverageCharges(
  userId: string,
  limitTypes: LimitType[] = [
    "customers",
    "qr_codes",
    "documents",
    "api_calls",
    "email_sends",
  ]
): Promise<OverageCharge[]> {
  const config = await getUsageBillingConfig(userId);

  if (!config || !config.enabled) {
    return [];
  }

  const charges: OverageCharge[] = [];

  for (const limitType of limitTypes) {
    const limitCheck = await checkPlanLimit(userId, limitType);

    // Skip if unlimited or within limit
    if (
      limitCheck.limit === Infinity ||
      limitCheck.current <= limitCheck.limit
    ) {
      continue;
    }

    const overage = limitCheck.current - limitCheck.limit;
    const charge = overage * config.overageRate;

    charges.push({
      limitType,
      limit: limitCheck.limit,
      usage: limitCheck.current,
      overage,
      charge,
    });
  }

  return charges;
}

/**
 * Get total overage charges for current billing period
 */
export async function getTotalOverageCharges(userId: string): Promise<number> {
  const charges = await calculateOverageCharges(userId);
  return charges.reduce((total, charge) => total + charge.charge, 0);
}

/**
 * Record usage for billing purposes
 */
export async function recordUsageForBilling(
  userId: string,
  metricType: string,
  metricValue: number = 1,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const supabase = await getSupabaseServer();

    // Determine period based on metric type
    if (["documents", "api_calls", "email_sends"].includes(metricType)) {
      // Monthly metrics
      // Period is handled by the database function
    } else {
      // Lifetime metrics
      // Period is handled by the database function
    }

    const { error } = await supabase.rpc("record_usage", {
      p_user_id: userId,
      p_metric_type: metricType,
      p_metric_value: metricValue,
      p_metadata: metadata || {},
    });

    if (error) {
      logger.error("Error recording usage:", error);
    }
  } catch (error) {
    logger.error("Error in recordUsageForBilling:", error);
  }
}

/**
 * Check if user is approaching limit and should be warned
 */
export async function checkUsageWarnings(
  userId: string,
  warningThreshold: number = 80 // Warn at 80% of limit
): Promise<
  Array<{
    limitType: LimitType;
    current: number;
    limit: number;
    percentage: number;
  }>
> {
  const warnings: Array<{
    limitType: LimitType;
    current: number;
    limit: number;
    percentage: number;
  }> = [];

  const limitTypes: LimitType[] = [
    "customers",
    "qr_codes",
    "documents",
    "api_calls",
    "email_sends",
  ];

  for (const limitType of limitTypes) {
    const limitCheck = await checkPlanLimit(userId, limitType);

    if (limitCheck.limit === Infinity) {
      continue;
    }

    const percentage = (limitCheck.current / limitCheck.limit) * 100;

    if (percentage >= warningThreshold) {
      warnings.push({
        limitType,
        current: limitCheck.current,
        limit: limitCheck.limit,
        percentage: Math.round(percentage),
      });
    }
  }

  return warnings;
}
