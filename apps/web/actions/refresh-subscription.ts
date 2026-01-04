"use server";

import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";

// Type assertion to handle Next.js 16 type requirements
const revalidateTagSafe = revalidateTag as (tag: string) => void;
import { env } from "@/env.mjs";

import { supabaseAdmin } from "@/lib/db";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { logger } from "@/lib/logger";
import { fixPolarSubscription } from "./fix-polar-subscription";

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

    // Use fix function to sync Polar subscription
    const result = await fixPolarSubscription();
    
    if (result.success) {
      // Invalidate cache to force refresh
      revalidateTagSafe("subscription-plan");
      
      // Get updated subscription plan
      const updatedPlan = await getUserSubscriptionPlan(user.id);
      
      return {
        success: true,
        message: "Polar subscription data refreshed successfully",
        subscription: {
          plan: updatedPlan.title,
          isPaid: updatedPlan.isPaid,
          interval: updatedPlan.interval,
          productId: updatedPlan.polarProductId,
        },
      };
    } else {
      return {
        success: false,
        message: result.message || "Failed to refresh Polar subscription",
      };
    }
  } catch (error) {
    logger.error("Unexpected error in refreshSubscription:", error);
    return { success: false, message: "Unexpected error occurred" };
  }
}
