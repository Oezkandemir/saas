import { getUserSubscriptionPlan } from "@/lib/subscription";
import { getSupabaseServer } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

export type LimitType = "customers" | "qr_codes" | "documents";

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  limitType: LimitType;
  message?: string;
}

/**
 * Get the limit for a specific resource based on the user's plan
 */
function getPlanLimit(planTitle: string, limitType: LimitType): number {
  // Free plan limits
  if (planTitle === "Free") {
    switch (limitType) {
      case "customers":
        return 3;
      case "qr_codes":
        return 3; // Same as customers since each customer gets a QR code
      case "documents":
        return 3; // Per month
      default:
        return Infinity;
    }
  }
  
  // Pro and Enterprise plans have unlimited resources
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
    const limit = getPlanLimit(subscriptionPlan.title, limitType);
    
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



