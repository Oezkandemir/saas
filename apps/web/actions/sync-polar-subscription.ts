"use server";

import { auth } from "@/auth";

import { env } from "@/env.mjs";
import { supabaseAdmin } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Sync Polar subscription from checkout_id
 * Called when user returns from Polar checkout
 */
export async function syncPolarSubscriptionFromCheckout(
  checkoutId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user || !user.id) {
      return { success: false, message: "User not authenticated" };
    }

    if (!checkoutId) {
      return { success: false, message: "No checkout ID provided" };
    }

    logger.info(`Syncing Polar subscription for checkout: ${checkoutId}`);

    // Fetch checkout details from Polar API
    const isSandbox =
      env.POLAR_USE_SANDBOX === "true" ||
      process.env.POLAR_USE_SANDBOX === "true";
    const apiUrl = isSandbox
      ? "https://sandbox-api.polar.sh/v1"
      : "https://api.polar.sh/v1";
    const accessToken =
      env.POLAR_ACCESS_TOKEN || process.env.POLAR_ACCESS_TOKEN;

    const checkoutResponse = await fetch(`${apiUrl}/checkouts/${checkoutId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.json().catch(() => ({}));
      logger.error("Failed to fetch Polar checkout", errorData);
      return {
        success: false,
        message: `Failed to fetch checkout: ${errorData.error || checkoutResponse.statusText}`,
      };
    }

    const checkout = await checkoutResponse.json();

    // Check if checkout was successful
    if (checkout.status !== "succeeded") {
      return {
        success: false,
        message: `Checkout not completed. Status: ${checkout.status}`,
      };
    }

    // Get subscription ID from checkout
    const subscriptionId = checkout.subscription_id;
    const productId = checkout.product_id;
    const customerId = checkout.customer_id;

    if (!subscriptionId && !productId) {
      return {
        success: false,
        message: "No subscription or product ID found in checkout",
      };
    }

    // If we have a subscription ID, fetch full subscription details
    if (subscriptionId) {
      const subscriptionResponse = await fetch(
        `${apiUrl}/subscriptions/${subscriptionId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (subscriptionResponse.ok) {
        const subscription = await subscriptionResponse.json();

        // Update user with Polar subscription data
        const currentPeriodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;
        const currentPeriodStart = subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000).toISOString()
          : null;

        const { error: userUpdateError } = await supabaseAdmin
          .from("users")
          .update({
            polar_customer_id: subscription.customer_id || customerId,
            polar_subscription_id: subscriptionId,
            polar_product_id: subscription.product_id || productId,
            polar_current_period_end: currentPeriodEnd,
            payment_provider: "polar",
          })
          .eq("id", user.id);

        if (userUpdateError) {
          logger.error("Error updating user Polar data", userUpdateError);
          return {
            success: false,
            message: `Failed to update user: ${userUpdateError.message}`,
          };
        }

        // Update or create subscription record
        const subscriptionData: any = {
          user_id: user.id,
          polar_subscription_id: subscriptionId,
          polar_customer_id: subscription.customer_id || customerId,
          polar_product_id: subscription.product_id || productId,
          status: subscription.status === "active" ? "active" : "past_due",
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          payment_provider: "polar",
          updated_at: new Date().toISOString(),
        };

        // Check if subscription already exists
        const { data: existingSub } = await supabaseAdmin
          .from("subscriptions")
          .select("id")
          .eq("polar_subscription_id", subscriptionId)
          .single();

        if (existingSub) {
          await supabaseAdmin
            .from("subscriptions")
            .update(subscriptionData)
            .eq("id", existingSub.id);
        } else {
          await supabaseAdmin.from("subscriptions").insert(subscriptionData);
        }

        logger.info(
          `Successfully synced Polar subscription ${subscriptionId} for user ${user.id}`
        );

        // Generate customer portal link after successful subscription
        if (subscription.customer_id || customerId) {
          try {
            const { generatePolarCustomerPortalLink } = await import(
              "@/lib/polar"
            );
            const portalUrl = await generatePolarCustomerPortalLink(
              subscription.customer_id || customerId
            );

            // Optionally store the portal URL in the database
            // You could add a column like 'polar_portal_url' to the users table
            logger.info(
              `Generated customer portal link for user ${user.id}: ${portalUrl}`
            );

            // TODO: Store portal URL in database or send via email/notification
            // Example: await supabaseAdmin.from("users").update({ polar_portal_url: portalUrl }).eq("id", user.id);
          } catch (portalError: any) {
            // Don't fail the sync if portal link generation fails
            logger.warn("Failed to generate customer portal link", portalError);
          }
        }

        return {
          success: true,
          message: "Subscription synced successfully",
        };
      }
    }

    // If no subscription ID but we have a product ID (one-time purchase)
    if (productId) {
      const { error: userUpdateError } = await supabaseAdmin
        .from("users")
        .update({
          polar_customer_id: customerId,
          polar_product_id: productId,
          payment_provider: "polar",
        })
        .eq("id", user.id);

      if (userUpdateError) {
        logger.error("Error updating user Polar data", userUpdateError);
        return {
          success: false,
          message: `Failed to update user: ${userUpdateError.message}`,
        };
      }

      logger.info(
        `Successfully synced Polar product ${productId} for user ${user.id}`
      );
      return {
        success: true,
        message: "Purchase synced successfully",
      };
    }

    return {
      success: false,
      message: "Unable to sync subscription data",
    };
  } catch (error: any) {
    logger.error("Error syncing Polar subscription", error);
    return {
      success: false,
      message: error.message || "Failed to sync subscription",
    };
  }
}
