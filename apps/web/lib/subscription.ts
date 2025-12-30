// @ts-nocheck
// TODO: Fix this when we turn strict mode on.
import { UserSubscriptionPlan } from "types";
import { pricingData } from "@/config/subscriptions";
import { supabaseAdmin } from "@/lib/db";
import { stripe } from "@/lib/stripe";
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

export async function getUserSubscriptionPlan(
  userId: string,
  userEmail?: string,
): Promise<UserSubscriptionPlan> {
  // If no userId provided, return the default free plan
  if (!userId) {
    logger.warn("getUserSubscriptionPlan called without userId");
    return DEFAULT_FREE_PLAN;
  }

  try {
    // Fetch user with Supabase by ID
    let userData = null;
    let error = null;

    // Try to find by user ID first
    const userResult = await supabaseAdmin
      .from("users")
      .select(
        "id, email, stripe_customer_id, stripe_subscription_id, stripe_price_id, stripe_current_period_end",
      )
      .eq("id", userId)
      .single();

    userData = userResult.data;
    error = userResult.error;

    logger.debug(`Fetching subscription data for user ${userId}`, { userData });

    // If user not found by ID and we have an email, try to find by email
    if ((!userData || error) && userEmail) {
      logger.info(
        `User not found by ID ${userId}, trying with email ${userEmail}`,
      );
      const emailResult = await supabaseAdmin
        .from("users")
        .select(
          "id, email, stripe_customer_id, stripe_subscription_id, stripe_price_id, stripe_current_period_end",
        )
        .eq("email", userEmail)
        .single();

      if (emailResult.data && !emailResult.error) {
        logger.info(
          `Found user by email ${userEmail} with ID ${emailResult.data.id}`,
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
            updateResult.error,
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
        `User with id ${userId} not found in Supabase database: ${error?.message || "No data returned"}`,
      );
      return DEFAULT_FREE_PLAN;
    }

    // Map Supabase column names to our expected format
    const user = {
      stripeCustomerId: userData.stripe_customer_id,
      stripeSubscriptionId: userData.stripe_subscription_id,
      stripePriceId: userData.stripe_price_id,
      stripeCurrentPeriodEnd: userData.stripe_current_period_end
        ? new Date(userData.stripe_current_period_end)
        : null,
    };

    logger.debug("User stripe data", {
      customerId: user.stripeCustomerId,
      subscriptionId: user.stripeSubscriptionId,
      priceId: user.stripePriceId,
      periodEnd: user.stripeCurrentPeriodEnd,
    });

    // Check if user is on a paid plan.
    const isPaid =
      user.stripePriceId &&
      user.stripeCurrentPeriodEnd?.getTime() + 86_400_000 > Date.now()
        ? true
        : false;

    // Find the pricing data corresponding to the user's plan
    // First check monthly prices, then yearly prices
    const userPlan =
      pricingData.find(
        (plan) => plan.stripeIds.monthly === user.stripePriceId,
      ) ||
      pricingData.find((plan) => plan.stripeIds.yearly === user.stripePriceId);

    logger.debug("Matched plan", { planTitle: userPlan?.title || "No matching plan found" });

    // Use the found plan or default to free
    const plan = isPaid && userPlan ? userPlan : pricingData[0];

    // Determine the interval based on which price ID matched
    const interval = isPaid
      ? userPlan?.stripeIds.monthly === user.stripePriceId
        ? "month"
        : userPlan?.stripeIds.yearly === user.stripePriceId
          ? "year"
          : null
      : null;

    // Check if subscription is set to cancel at period end
    let isCanceled = false;
    if (isPaid && user.stripeSubscriptionId) {
      try {
        const stripePlan = await stripe.subscriptions.retrieve(
          user.stripeSubscriptionId,
        );
        isCanceled = stripePlan.cancel_at_period_end;
      } catch (stripeError) {
        logger.error("Error retrieving Stripe subscription", stripeError);
        // Continue with default values if Stripe call fails
      }
    }

    // Return the complete user subscription plan
    const result = {
      ...plan,
      ...user,
      stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd?.getTime() || 0,
      isPaid,
      interval,
      isCanceled,
    };

    logger.debug("Returning subscription plan", {
      title: result.title,
      isPaid: result.isPaid,
      priceId: result.stripePriceId,
      interval: result.interval,
    });

    return result;
  } catch (error) {
    logger.error("Unexpected error in getUserSubscriptionPlan", error);
    // Return default plan in case of any error
    return DEFAULT_FREE_PLAN;
  }
}
