"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";

import { supabaseAdmin } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getUserSubscriptionPlan } from "@/lib/subscription";

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

    // Get user data from database
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("stripe_subscription_id, stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      console.error("Error fetching user data:", userError);
      return { success: false, message: "Error fetching user data" };
    }

    // If there's no subscription ID, nothing to refresh
    if (!userData.stripe_subscription_id) {
      return { success: false, message: "No active subscription found" };
    }

    // Fetch latest subscription data from Stripe
    try {
      const subscription = await stripe.subscriptions.retrieve(
        userData.stripe_subscription_id,
      );

      // Update user subscription data in database
      const { error: updateError } = await supabaseAdmin
        .from("users")
        .update({
          stripe_price_id: subscription.items.data[0].price.id,
          stripe_current_period_end: new Date(
            subscription.current_period_end * 1000,
          ).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating subscription data:", updateError);
        return {
          success: false,
          message: "Error updating subscription data in database",
        };
      }

      // Get updated subscription plan
      const updatedPlan = await getUserSubscriptionPlan(user.id);

      return {
        success: true,
        message: "Subscription data refreshed successfully",
        subscription: {
          plan: updatedPlan.title,
          isPaid: updatedPlan.isPaid,
          interval: updatedPlan.interval,
          priceId: updatedPlan.stripePriceId,
        },
      };
    } catch (stripeError) {
      console.error("Error retrieving subscription from Stripe:", stripeError);
      return {
        success: false,
        message: "Error retrieving subscription data from Stripe",
      };
    }
  } catch (error) {
    console.error("Unexpected error in refreshSubscription:", error);
    return { success: false, message: "Unexpected error occurred" };
  }
}
