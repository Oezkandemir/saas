"use server";

import { z } from "zod";

import { getCurrentUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

const featureUsageSchema = z.object({
  feature_name: z.enum([
    "document_created",
    "document_updated",
    "document_deleted",
    "document_viewed",
    "qr_code_created",
    "qr_code_updated",
    "qr_code_deleted",
    "qr_code_scanned",
    "customer_created",
    "customer_updated",
    "customer_deleted",
    "invoice_sent",
    "quote_sent",
    "payment_received",
    "subscription_created",
    "subscription_updated",
    "subscription_cancelled",
  ]),
  metadata: z.record(z.unknown()).optional().default({}),
});

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type FeatureUsage = {
  id: string;
  user_id: string;
  feature_name: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type UsageStatistics = {
  date: string;
  feature_name: string;
  usage_count: number;
};

export type PeakUsageTime = {
  hour_of_day: number;
  usage_count: number;
};

/**
 * Record feature usage
 */
export async function recordFeatureUsage(
  input: z.infer<typeof featureUsageSchema>,
): Promise<ActionResult<FeatureUsage>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const validated = featureUsageSchema.parse(input);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("feature_usage")
      .insert({
        user_id: user.id,
        feature_name: validated.feature_name,
        metadata: validated.metadata || {},
      })
      .select()
      .single();

    if (error) {
      logger.error("Error recording feature usage:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: {
        ...data,
        metadata:
          typeof data.metadata === "object"
            ? (data.metadata as Record<string, unknown>)
            : {},
      } as FeatureUsage,
    };
  } catch (error) {
    logger.error("Error in recordFeatureUsage:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation error",
      };
    }
    return {
      success: false,
      error: "Failed to record feature usage",
    };
  }
}

/**
 * Get usage statistics
 */
export async function getUsageStatistics(
  startDate?: Date,
  endDate?: Date,
  userId?: string,
): Promise<ActionResult<UsageStatistics[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Users can only view their own stats, admins can view all
    if (userId && userId !== user.id && user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Can only view own statistics",
      };
    }

    const supabase = await createClient();

    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();
    const targetUserId = userId || (user.role === "ADMIN" ? undefined : user.id);

    const { data, error } = await supabase.rpc("get_feature_usage_stats", {
      p_start_date: start.toISOString(),
      p_end_date: end.toISOString(),
      p_user_id: targetUserId || null,
    });

    if (error) {
      // Early check: if error is an empty object, return silently
      if (typeof error === "object" && error !== null && Object.keys(error).length === 0) {
        return {
          success: true,
          data: [],
        };
      }

      // If function doesn't exist (code 42883) or other errors, return empty array instead of failing
      const errorCode = typeof error === "object" && error !== null ? (error as any).code : null;
      const errorMessage = typeof error === "object" && error !== null ? (error as any).message : String(error);
      
      // Check if error object has meaningful properties
      // Only consider it meaningful if we have a valid error code OR a valid error message (not "[object Object]")
      const isValidMessage = errorMessage && typeof errorMessage === "string" && errorMessage.length > 0 && errorMessage !== "[object Object]";
      const isValidCode = errorCode && typeof errorCode === "string" && errorCode.length > 0;
      const hasMeaningfulError = isValidCode || isValidMessage;
      
      if (errorCode === "42883" || (errorMessage && typeof errorMessage === "string" && errorMessage.includes("does not exist"))) {
        logger.warn("get_feature_usage_stats function not found, returning empty data");
        return {
          success: true,
          data: [],
        };
      }
      // Log error only if it has meaningful content
      if (hasMeaningfulError) {
        if (isValidCode && isValidMessage) {
          logger.error("Error fetching usage statistics:", { code: errorCode, message: errorMessage });
        } else if (isValidCode) {
          logger.error("Error fetching usage statistics:", { code: errorCode });
        } else if (isValidMessage) {
          logger.error("Error fetching usage statistics:", { message: errorMessage });
        } else {
          logger.warn("Error fetching usage statistics (minimal details), returning empty data");
        }
      } else {
        logger.warn("Error fetching usage statistics (no meaningful error details), returning empty data");
      }
      // Return success with empty data to prevent UI from breaking
      return {
        success: true,
        data: [],
      };
    }

    return {
      success: true,
      data: (data || []) as UsageStatistics[],
    };
  } catch (error) {
    logger.error("Error in getUsageStatistics:", error);
    // Return success with empty data to prevent UI from breaking
    return {
      success: true,
      data: [],
    };
  }
}

/**
 * Get user-specific usage statistics
 */
export async function getUserUsageStats(
  userId?: string,
  days = 30,
): Promise<ActionResult<UsageStatistics[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const targetUserId = userId || user.id;

    // Users can only view their own stats, admins can view any
    if (targetUserId !== user.id && user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Can only view own statistics",
      };
    }

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    return getUsageStatistics(startDate, endDate, targetUserId);
  } catch (error) {
    logger.error("Error in getUserUsageStats:", error);
    return {
      success: false,
      error: "Failed to fetch user usage statistics",
    };
  }
}

/**
 * Get feature usage trends over time
 */
export async function getFeatureUsageTrends(
  featureName?: string,
  days = 30,
): Promise<ActionResult<UsageStatistics[]>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    const supabase = await createClient();
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase.rpc("get_feature_usage_stats", {
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString(),
      p_user_id: null,
    });

    if (error) {
      // Early check: if error is an empty object, return silently
      if (typeof error === "object" && error !== null && Object.keys(error).length === 0) {
        return {
          success: true,
          data: [],
        };
      }

      // If function doesn't exist (code 42883) or other errors, return empty array instead of failing
      const errorCode = typeof error === "object" && error !== null ? (error as any).code : null;
      const errorMessage = typeof error === "object" && error !== null ? (error as any).message : String(error);
      
      // Check if error object has meaningful properties
      // Only consider it meaningful if we have a valid error code OR a valid error message (not "[object Object]")
      const isValidMessage = errorMessage && typeof errorMessage === "string" && errorMessage.length > 0 && errorMessage !== "[object Object]";
      const isValidCode = errorCode && typeof errorCode === "string" && errorCode.length > 0;
      const hasMeaningfulError = isValidCode || isValidMessage;
      
      if (errorCode === "42883" || (errorMessage && typeof errorMessage === "string" && errorMessage.includes("does not exist"))) {
        logger.warn("get_feature_usage_stats function not found, returning empty data");
        return {
          success: true,
          data: [],
        };
      }
      // Log error only if it has meaningful content
      if (hasMeaningfulError) {
        if (isValidCode && isValidMessage) {
          logger.error("Error fetching feature usage trends:", { code: errorCode, message: errorMessage });
        } else if (isValidCode) {
          logger.error("Error fetching feature usage trends:", { code: errorCode });
        } else if (isValidMessage) {
          logger.error("Error fetching feature usage trends:", { message: errorMessage });
        } else {
          logger.warn("Error fetching feature usage trends (minimal details), returning empty data");
        }
      } else {
        logger.warn("Error fetching feature usage trends (no meaningful error details), returning empty data");
      }
      // Return success with empty data to prevent UI from breaking
      return {
        success: true,
        data: [],
      };
    }

    let result = (data || []) as UsageStatistics[];

    // Filter by feature name if provided
    if (featureName) {
      result = result.filter((stat) => stat.feature_name === featureName);
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    logger.error("Error in getFeatureUsageTrends:", error);
    // Return success with empty data to prevent UI from breaking
    return {
      success: true,
      data: [],
    };
  }
}

/**
 * Get peak usage times
 */
export async function getPeakUsageTimes(
  days = 30,
): Promise<ActionResult<PeakUsageTime[]>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    const supabase = await createClient();
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase.rpc("get_peak_usage_times", {
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString(),
    });

    if (error) {
      // Early check: if error is an empty object, return silently
      if (typeof error === "object" && error !== null && Object.keys(error).length === 0) {
        return {
          success: true,
          data: [],
        };
      }

      // If function doesn't exist (code 42883) or other errors, return empty array instead of failing
      const errorCode = typeof error === "object" && error !== null ? (error as any).code : null;
      const errorMessage = typeof error === "object" && error !== null ? (error as any).message : String(error);
      
      // Check if error object has meaningful properties
      // Only consider it meaningful if we have a valid error code OR a valid error message (not "[object Object]")
      const isValidMessage = errorMessage && typeof errorMessage === "string" && errorMessage.length > 0 && errorMessage !== "[object Object]";
      const isValidCode = errorCode && typeof errorCode === "string" && errorCode.length > 0;
      const hasMeaningfulError = isValidCode || isValidMessage;
      
      if (errorCode === "42883" || (errorMessage && typeof errorMessage === "string" && errorMessage.includes("does not exist"))) {
        logger.warn("get_peak_usage_times function not found, returning empty data");
        return {
          success: true,
          data: [],
        };
      }
      // Log error only if it has meaningful content
      if (hasMeaningfulError) {
        if (isValidCode && isValidMessage) {
          logger.error("Error fetching peak usage times:", { code: errorCode, message: errorMessage });
        } else if (isValidCode) {
          logger.error("Error fetching peak usage times:", { code: errorCode });
        } else if (isValidMessage) {
          logger.error("Error fetching peak usage times:", { message: errorMessage });
        } else {
          logger.warn("Error fetching peak usage times (minimal details), returning empty data");
        }
      } else {
        logger.warn("Error fetching peak usage times (no meaningful error details), returning empty data");
      }
      // Return success with empty data to prevent UI from breaking
      return {
        success: true,
        data: [],
      };
    }

    return {
      success: true,
      data: (data || []) as PeakUsageTime[],
    };
  } catch (error) {
    logger.error("Error in getPeakUsageTimes:", error);
    // Return success with empty data to prevent UI from breaking
    return {
      success: true,
      data: [],
    };
  }
}

