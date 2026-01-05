"use server";

import { revalidateTag } from "next/cache";
import { auth } from "@/auth";

import { supabaseAdmin } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  cancelPolarSubscription,
  getPolarSubscription,
  reactivatePolarSubscription,
  updatePolarSubscription,
} from "@/lib/polar";

// Type assertion to handle Next.js 16 type requirements
const revalidateTagSafe = revalidateTag as (tag: string) => void;

export type ManageSubscriptionResult = {
  success: boolean;
  message: string;
  subscription?: any;
};

/**
 * Cancel user's Polar subscription
 */
export async function cancelSubscription(
  cancelAtPeriodEnd: boolean = true,
): Promise<ManageSubscriptionResult> {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user || !user.id) {
      return { success: false, message: "User not authenticated" };
    }

    // Get user's Polar subscription ID
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("polar_subscription_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData || !userData.polar_subscription_id) {
      return { success: false, message: "No active subscription found" };
    }

    // Cancel subscription via Polar API
    const subscription = await cancelPolarSubscription(
      userData.polar_subscription_id,
      cancelAtPeriodEnd,
    );

    // Update database
    await supabaseAdmin
      .from("subscriptions")
      .update({
        cancel_at_period_end: cancelAtPeriodEnd,
        status: cancelAtPeriodEnd ? "active" : "canceled",
        updated_at: new Date().toISOString(),
      })
      .eq("polar_subscription_id", userData.polar_subscription_id);

    // Invalidate cache
    revalidateTagSafe("subscription-plan");

    logger.info(
      `Subscription ${userData.polar_subscription_id} canceled for user ${user.id}`,
    );

    return {
      success: true,
      message: cancelAtPeriodEnd
        ? "Subscription will be canceled at the end of the billing period"
        : "Subscription canceled immediately",
      subscription,
    };
  } catch (error: any) {
    logger.error("Error canceling subscription", error);
    return {
      success: false,
      message: error.message || "Failed to cancel subscription",
    };
  }
}

/**
 * Reactivate a canceled subscription
 */
export async function reactivateSubscription(): Promise<ManageSubscriptionResult> {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user || !user.id) {
      return { success: false, message: "User not authenticated" };
    }

    // Get user's Polar subscription ID
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("polar_subscription_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData || !userData.polar_subscription_id) {
      return { success: false, message: "No subscription found" };
    }

    // Reactivate subscription via Polar API
    const subscription = await reactivatePolarSubscription(
      userData.polar_subscription_id,
    );

    // Update database
    await supabaseAdmin
      .from("subscriptions")
      .update({
        cancel_at_period_end: false,
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("polar_subscription_id", userData.polar_subscription_id);

    // Invalidate cache
    revalidateTagSafe("subscription-plan");

    logger.info(
      `Subscription ${userData.polar_subscription_id} reactivated for user ${user.id}`,
    );

    return {
      success: true,
      message: "Subscription reactivated successfully",
      subscription,
    };
  } catch (error: any) {
    logger.error("Error reactivating subscription", error);
    return {
      success: false,
      message: error.message || "Failed to reactivate subscription",
    };
  }
}

/**
 * Update subscription plan (upgrade/downgrade)
 */
export async function updateSubscriptionPlan(
  newProductId: string,
): Promise<ManageSubscriptionResult> {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user || !user.id) {
      return { success: false, message: "User not authenticated" };
    }

    // Get user's Polar subscription ID - check both users table and subscriptions table
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("polar_subscription_id, polar_product_id, polar_customer_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      logger.error("Error fetching user data", userError);
      return { success: false, message: "Error fetching user data" };
    }

    // If no subscription ID in users table, check subscriptions table
    let subscriptionId = userData.polar_subscription_id;

    if (!subscriptionId) {
      const { data: subData, error: subError } = await supabaseAdmin
        .from("subscriptions")
        .select("polar_subscription_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!subError && subData?.polar_subscription_id) {
        subscriptionId = subData.polar_subscription_id;
        // Update users table with subscription ID
        await supabaseAdmin
          .from("users")
          .update({ polar_subscription_id: subscriptionId })
          .eq("id", user.id);
      }
    }

    if (!subscriptionId) {
      logger.warn(`No active subscription found for user ${user.id}`);
      return {
        success: false,
        message: "No active subscription found. Please contact support.",
      };
    }

    // Update subscription via Polar API
    const subscription = await updatePolarSubscription(
      subscriptionId,
      newProductId,
    );

    // Update database
    await supabaseAdmin
      .from("users")
      .update({
        polar_product_id: newProductId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    await supabaseAdmin
      .from("subscriptions")
      .update({
        polar_product_id: newProductId,
        updated_at: new Date().toISOString(),
      })
      .eq("polar_subscription_id", subscriptionId);

    // Invalidate cache
    revalidateTagSafe("subscription-plan");

    logger.info(
      `Subscription ${subscriptionId} updated to product ${newProductId} for user ${user.id}`,
    );

    return {
      success: true,
      message: "Subscription plan updated successfully",
      subscription,
    };
  } catch (error: any) {
    logger.error("Error updating subscription plan", error);
    return {
      success: false,
      message: error.message || "Failed to update subscription plan",
    };
  }
}

/**
 * Get current subscription details
 */
export async function getCurrentSubscription(): Promise<ManageSubscriptionResult> {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user || !user.id) {
      return { success: false, message: "User not authenticated" };
    }

    // Get user's Polar subscription ID
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("polar_subscription_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData || !userData.polar_subscription_id) {
      return { success: false, message: "No active subscription found" };
    }

    // Fetch subscription from Polar API
    const subscription = await getPolarSubscription(
      userData.polar_subscription_id,
    );

    return {
      success: true,
      message: "Subscription retrieved successfully",
      subscription,
    };
  } catch (error: any) {
    logger.error("Error fetching subscription", error);
    return {
      success: false,
      message: error.message || "Failed to fetch subscription",
    };
  }
}
