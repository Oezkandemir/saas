// @ts-nocheck
// TODO: Fix this when we turn strict mode on.

import { unstable_cache, unstable_noStore } from "next/cache";
import { cache } from "react";

import type { UserSubscriptionPlan } from "types";
import { pricingData } from "@/config/subscriptions";
import { supabaseAdmin } from "@/lib/db";
import { logger } from "@/lib/logger";

// Default free subscription plan as a fallback
const DEFAULT_FREE_PLAN: UserSubscriptionPlan = {
  ...pricingData[0],
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  stripePriceId: null,
  stripeCurrentPeriodEnd: 0,
  isPaid: false,
  interval: null,
  isCanceled: false,
};

// Internal function that performs the actual database query
async function _getUserSubscriptionPlanInternal(
  userId: string,
  userEmail?: string,
  skipCache?: boolean
): Promise<UserSubscriptionPlan> {
  // If no userId provided, return the default free plan
  if (!userId) {
    logger.warn("getUserSubscriptionPlan called without userId");
    return DEFAULT_FREE_PLAN;
  }

  // Skip cache if explicitly requested (e.g., after sync)
  if (skipCache) {
    unstable_noStore();
  }

  try {
    // Fetch user with Supabase by ID
    let userData = null;
    let error = null;

    // Try to find by user ID first
    const userResult = await supabaseAdmin
      .from("users")
      .select(
        "id, email, polar_customer_id, polar_subscription_id, polar_product_id, polar_current_period_end, payment_provider"
      )
      .eq("id", userId)
      .single();

    userData = userResult.data;
    error = userResult.error;

    // Fetching subscription data silently

    // If user not found by ID and we have an email, try to find by email
    if ((!userData || error) && userEmail) {
      logger.info(
        `User not found by ID ${userId}, trying with email ${userEmail}`
      );
      const emailResult = await supabaseAdmin
        .from("users")
        .select(
          "id, email, polar_customer_id, polar_subscription_id, polar_product_id, polar_current_period_end, payment_provider"
        )
        .eq("email", userEmail)
        .single();

      if (emailResult.data && !emailResult.error) {
        logger.info(
          `Found user by email ${userEmail} with ID ${emailResult.data.id}`
        );
        userData = emailResult.data;
        error = null;

        // Update the user ID to match auth ID
        const updateResult = await supabaseAdmin
          .from("users")
          .update({ id: userId })
          .eq("id", userData.id);

        if (updateResult.error) {
          logger.error(
            `Failed to update user ID from ${userData.id} to ${userId}`,
            updateResult.error
          );
        } else {
          logger.info(`Updated user ID from ${userData.id} to ${userId}`);
          userData.id = userId;
        }
      }
    }

    // If user not found, return the default free plan instead of throwing an error
    if (error || !userData) {
      logger.warn(
        `User with id ${userId} not found in Supabase database: ${error?.message || "No data returned"}`
      );
      return DEFAULT_FREE_PLAN;
    }

    // Use Polar only (Stripe is deprecated)
    const paymentProvider = userData.payment_provider || "polar";
    const _isPolar = true; // Always use Polar now

    // Map Supabase column names to our expected format
    const user: any = {
      // Stripe fields deprecated - kept for backward compatibility but always null
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
      // Polar fields
      polarCustomerId: userData.polar_customer_id,
      polarSubscriptionId: userData.polar_subscription_id,
      polarProductId: userData.polar_product_id,
      polarCurrentPeriodEnd: userData.polar_current_period_end
        ? new Date(userData.polar_current_period_end)
        : null,
      polarCurrentPeriodStart: null,
      polarSubscriptionStart: null,
      paymentProvider,
    };

    // User subscription data loaded

    // Check if user is on a paid plan (Polar only)
    const _currentPeriodEnd = user.polarCurrentPeriodEnd;
    const productId = user.polarProductId;

    // For Polar: if product_id exists, consider it paid
    const isPaid = !!productId;

    // Find the pricing data corresponding to the user's plan (Polar only)
    let userPlan = null;

    // Log all available Polar product IDs for debugging
    // Matching Polar product ID silently

    // Check Polar product IDs - try monthly first, then yearly
    // IMPORTANT: Check all plans to find exact match
    for (const plan of pricingData) {
      if (plan.polarIds?.monthly === user.polarProductId) {
        userPlan = plan;
        // Plan matched silently
        break;
      }
      if (plan.polarIds?.yearly === user.polarProductId) {
        userPlan = plan;
        // Plan matched silently
        break;
      }
    }

    if (!userPlan && isPaid && user.polarProductId) {
      logger.error(
        "CRITICAL: No exact Polar product ID match found! This indicates a configuration mismatch.",
        {
          userProductId: user.polarProductId,
          availableProductIds: pricingData.map((plan) => ({
            planTitle: plan.title,
            monthlyId: plan.polarIds?.monthly,
            yearlyId: plan.polarIds?.yearly,
          })),
        }
      );
      // Don't assign a fallback plan - this is a configuration error
      // Return free plan instead to prevent showing wrong plan
      logger.warn(
        "Returning free plan due to product ID mismatch. Please check configuration."
      );
    }

    // Plan matching completed silently

    // Use the found plan or default to free
    const plan = isPaid && userPlan ? userPlan : pricingData[0];

    // Determine the interval based on which Polar product ID matched
    const interval =
      isPaid && userPlan
        ? userPlan.polarIds?.monthly === user.polarProductId
          ? "month"
          : userPlan.polarIds?.yearly === user.polarProductId
            ? "year"
            : null
        : null;

    // Check if subscription is set to cancel at period end (Polar only)
    let isCanceled = false;
    if (isPaid && user.polarSubscriptionId) {
      // For Polar, check subscription status from database
      try {
        const { data: subData } = await supabaseAdmin
          .from("subscriptions")
          .select(
            "status, cancel_at_period_end, current_period_start, created_at"
          )
          .eq("polar_subscription_id", user.polarSubscriptionId)
          .single();

        if (subData) {
          isCanceled =
            subData.status === "canceled" ||
            subData.cancel_at_period_end === true;
          // Store period start if available
          if (subData.current_period_start && !user.polarCurrentPeriodStart) {
            user.polarCurrentPeriodStart = new Date(
              subData.current_period_start
            );
          }
          // Store created_at as subscription start date
          if (subData.created_at && !user.polarSubscriptionStart) {
            user.polarSubscriptionStart = new Date(subData.created_at);
          }
        }
      } catch (error: any) {
        logger.debug("Error checking Polar subscription status", error);
      }
    }

    // Return the complete user subscription plan (Polar only)
    const result = {
      ...plan,
      // Stripe fields deprecated - always null
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeCurrentPeriodEnd: 0,
      // Polar fields
      polarCustomerId: user.polarCustomerId,
      polarSubscriptionId: user.polarSubscriptionId,
      polarProductId: user.polarProductId,
      polarCurrentPeriodEnd: user.polarCurrentPeriodEnd?.getTime() || 0,
      polarCurrentPeriodStart: user.polarCurrentPeriodStart?.getTime() || 0,
      polarSubscriptionStart: user.polarSubscriptionStart?.getTime() || 0,
      isPaid,
      interval,
      isCanceled,
    };

    // Subscription plan returned silently

    return result;
  } catch (error) {
    logger.error("Unexpected error in getUserSubscriptionPlan", error);
    // Return default plan in case of any error
    return DEFAULT_FREE_PLAN;
  }
}

// Cached version using React cache() for request-level deduplication
// This ensures that multiple calls to getUserSubscriptionPlan within the same request
// will only execute the database query once
// Cache reduced to 10 seconds to ensure more up-to-date subscription data
export const getUserSubscriptionPlan = cache(
  unstable_cache(
    async (
      userId: string,
      userEmail?: string
    ): Promise<UserSubscriptionPlan> => {
      return _getUserSubscriptionPlanInternal(userId, userEmail, false);
    },
    ["user-subscription-plan"],
    {
      revalidate: 10, // Cache for 10 seconds (reduced for better real-time updates)
      tags: ["subscription-plan"],
    }
  )
);
