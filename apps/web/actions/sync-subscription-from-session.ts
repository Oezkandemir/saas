"use server";

import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";

export type SyncSessionResult = {
  success: boolean;
  message: string;
};

/**
 * Sync subscription from Stripe checkout session
 * This is called when user returns from Stripe checkout with a session_id
 */
export async function syncSubscriptionFromSession(
  sessionId: string,
): Promise<SyncSessionResult> {
  try {
    // Get authenticated user
    const session = await auth();
    const user = session?.user;

    if (!user || !user.id) {
      return { success: false, message: "User not authenticated" };
    }

    if (!sessionId) {
      return { success: false, message: "No session ID provided" };
    }

    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (!checkoutSession) {
      return { success: false, message: "Checkout session not found" };
    }

    // Check if the session was successful
    if (checkoutSession.payment_status !== "paid") {
      return {
        success: false,
        message: "Payment not completed yet",
      };
    }

    // Get the subscription ID from the session
    const subscriptionId = checkoutSession.subscription as string | null;

    if (!subscriptionId) {
      return {
        success: false,
        message: "No subscription found in checkout session",
      };
    }

    // Retrieve the subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    if (!subscription || subscription.status !== "active") {
      return {
        success: false,
        message: "Subscription is not active",
      };
    }

    // Get customer ID
    const customerId = subscription.customer as string;
    const priceId = subscription.items.data[0].price.id;

    // Update user in database with subscription data
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        stripe_price_id: priceId,
        stripe_current_period_end: new Date(
          subscription.current_period_end * 1000,
        ).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      logger.error("Error updating subscription data:", updateError);
      return {
        success: false,
        message: "Error updating subscription data in database",
      };
    }

    logger.info(
      `Successfully synced subscription ${subscriptionId} for user ${user.id}`,
    );

    // Note: Revalidation removed temporarily to fix compilation issues
    // The UI will update on next page navigation/refresh

    return {
      success: true,
      message: "Subscription synchronized successfully",
    };
  } catch (error: any) {
    logger.error("Error syncing subscription from session:", error);
    return {
      success: false,
      message: error.message || "Unexpected error occurred",
    };
  }
}

