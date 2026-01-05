"use server";

import { getCurrentUser } from "@/lib/session";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { UserSubscriptionPlan } from "@/types";
import { logger } from "@/lib/logger";

export async function getUserPlan(): Promise<UserSubscriptionPlan | null> {
  try {
    const user = await getCurrentUser();
    
    if (!user?.id) {
      return null;
    }

    try {
      const subscriptionPlan = await getUserSubscriptionPlan(user.id, user.email);
      return subscriptionPlan;
    } catch (subscriptionError) {
      // Log subscription-specific errors but don't fail completely
      logger.warn("Error fetching subscription plan:", {
        error: subscriptionError instanceof Error ? subscriptionError.message : String(subscriptionError),
      });
      return null;
    }
  } catch (error) {
    // Log session/user fetch errors
    logger.warn("Error fetching user for plan:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}












