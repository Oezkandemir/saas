"use server";

import { revalidateTag } from "next/cache";
import { auth } from "@/auth";

import { logger } from "@/lib/logger";

export type RefreshResult = {
  success: boolean;
  message: string;
  subscription?: any;
};

export async function refreshSubscription(): Promise<RefreshResult> {
  try {
    // Get authenticated user
    const session = await auth();
    const user = session?.user;

    if (!user || !user.id) {
      return { success: false, message: "User not authenticated" };
    }

    // Sync directly from Polar API to ensure we have the latest data
    const { syncPolarSubscriptionDirect } = await import(
      "@/actions/sync-polar-subscription-direct"
    );
    const syncResult = await syncPolarSubscriptionDirect();

    if (!syncResult.success) {
      logger.warn("Failed to sync from Polar API, using cached data", {
        message: syncResult.message,
      });
    }

    // Invalidate cache to force refresh
    revalidateTag("subscription-plan", "max");

    // Get current subscription plan (will use fresh data after sync)
    // Skip cache to ensure we get the latest data after sync
    const { getUserSubscriptionPlan } = await import("@/lib/subscription");
    const updatedPlan = await getUserSubscriptionPlan(user.id, user.email);

    // Log the plan details for debugging
    logger.info("Subscription refreshed:", {
      plan: updatedPlan.title,
      isPaid: updatedPlan.isPaid,
      productId: updatedPlan.polarProductId,
      interval: updatedPlan.interval,
    });

    return {
      success: true,
      message: syncResult.success
        ? "Subscription synced directly from Polar API"
        : "Subscription refreshed (using cached data)",
      subscription: {
        plan: updatedPlan.title,
        isPaid: updatedPlan.isPaid,
        interval: updatedPlan.interval,
        productId: updatedPlan.polarProductId,
      },
    };
  } catch (error) {
    logger.error("Unexpected error in refreshSubscription:", error);
    return { success: false, message: "Unexpected error occurred" };
  }
}
