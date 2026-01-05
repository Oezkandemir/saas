"use server";

import { revalidateTag } from "next/cache";
import { auth } from "@/auth";

import { supabaseAdmin } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getUserSubscriptionPlan } from "@/lib/subscription";

// Type assertion to handle Next.js 16 type requirements
const revalidateTagSafe = revalidateTag as (tag: string) => void;

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

    // Get user data from database (Polar only)
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("polar_subscription_id, polar_customer_id, payment_provider")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      logger.error("Error fetching user data:", userError);
      return { success: false, message: "Error fetching user data" };
    }

    // Subscriptions are automatically synced via webhooks
    // Just invalidate cache and return current subscription data
    revalidateTagSafe("subscription-plan");

    // Get current subscription plan
    const updatedPlan = await getUserSubscriptionPlan(user.id);

    return {
      success: true,
      message:
        "Subscription data refreshed (synced automatically via webhooks)",
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
