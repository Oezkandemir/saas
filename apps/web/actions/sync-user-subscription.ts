"use server";

import { auth } from "@/auth";

import { supabaseAdmin } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";

export async function syncUserSubscriptionFromStripe() {
  try {
    // Get authenticated user
    const session = await auth();
    const user = session?.user;

    if (!user || !user.id || !user.email) {
      return { success: false, message: "User not authenticated" };
    }

    // First, check if the user exists in Stripe
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (!customers.data.length) {
      return {
        success: false,
        message: "No Stripe customer found for this email",
      };
    }

    const customerId = customers.data[0].id;

    // Get subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (!subscriptions.data.length) {
      return { success: false, message: "No active subscriptions found" };
    }

    const subscription = subscriptions.data[0];

    // Get price details
    const priceId = subscription.items.data[0].price.id;

    // Update the user in the database
    const { error } = await supabaseAdmin
      .from("users")
      .update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        stripe_current_period_end: new Date(
          subscription.current_period_end * 1000,
        ).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      logger.error("Error updating user subscription data", error);
      return {
        success: false,
        message: "Failed to update subscription data in database",
      };
    }

    // Log successful sync
    logger.info("Successfully synced subscription for user", { userId: user.id, customerId, subscriptionId: subscription.id, priceId });

    return {
      success: true,
      message: "Subscription synced successfully",
      plan: priceId,
      customerId,
      subscriptionId: subscription.id,
    };
  } catch (error) {
    logger.error("Error syncing subscription", error);
    return {
      success: false,
      message: "An error occurred while syncing subscription",
    };
  }
}
