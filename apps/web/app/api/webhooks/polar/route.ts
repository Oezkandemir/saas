import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { env } from "@/env.mjs";
import { supabaseAdmin } from "@/lib/db";
import { logger } from "@/lib/logger";

// Type assertion to handle Next.js 16 type requirements
const revalidateTagSafe = revalidateTag as (tag: string) => void;

/**
 * Polar.sh Webhook Route
 * Handles webhook events from Polar.sh for subscription updates
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    // Note: Signature verification should be added in production
    // const signature = req.headers.get("polar-signature");

    // Verify webhook signature if webhook secret is configured
    // Note: Polar.sh may use different signature verification
    // For now, we'll process the webhook (you should add signature verification in production)

    const event = JSON.parse(body);

    logger.info(
      `Processing Polar webhook event: ${event.type}, eventId: ${event.id}, eventType: ${event.type}`,
    );

    switch (event.type) {
      case "checkout.succeeded":
        await handleCheckoutSucceeded(event.data);
        break;

      case "subscription.created":
      case "subscription.updated":
        await handleSubscriptionUpdated(event.data);
        break;

      case "subscription.canceled":
        await handleSubscriptionCanceled(event.data);
        break;

      default:
        logger.info(`Unhandled Polar webhook event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    logger.error("Error processing Polar webhook", error);
    return NextResponse.json(
      { error: "Webhook processing failed", message: error.message },
      { status: 500 },
    );
  }
}

/**
 * Handle checkout succeeded event
 */
async function handleCheckoutSucceeded(data: any) {
  try {
    const checkout = data.object;
    const customerEmail = checkout.customer_email;
    const subscriptionId = checkout.subscription_id;
    const productId = checkout.product_id;

    logger.info(
      `Checkout succeeded for ${customerEmail}, subscriptionId: ${subscriptionId}, productId: ${productId}`,
    );

    if (!customerEmail) {
      logger.error("No customer email in checkout event");
      return;
    }

    // Find user by email
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email")
      .eq("email", customerEmail)
      .single();

    if (userError || !userData) {
      logger.error(`User not found for email: ${customerEmail}`, userError);
      return;
    }

    // If subscription ID exists, fetch subscription details
    if (subscriptionId) {
      await syncPolarSubscription(userData.id, subscriptionId);
    } else if (productId) {
      // Update user with product ID (one-time purchase)
      await updateUserPolarData(userData.id, {
        polar_product_id: productId,
        payment_provider: "polar",
      });
    }
  } catch (error: any) {
    logger.error("Error handling checkout succeeded", error);
    throw error;
  }
}

/**
 * Handle subscription created/updated event
 */
async function handleSubscriptionUpdated(data: any) {
  try {
    const subscription = data.object;
    const subscriptionId = subscription.id;
    const customerId = subscription.customer_id;
    const productId = subscription.product_id;
    const customerEmail = subscription.customer?.email || subscription.customer_email;

    logger.info(
      `Subscription updated: ${subscriptionId}, customerId: ${customerId}, productId: ${productId}, status: ${subscription.status}, customerEmail: ${customerEmail}`,
    );

    let userData: { id: string } | null = null;
    let userError: any = null;

    // Try to find user by Polar customer ID first
    if (customerId) {
      const result = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("polar_customer_id", customerId)
        .single();

      userData = result.data;
      userError = result.error;
    }

    // If not found by customer ID, try to find by subscription ID
    if ((userError || !userData) && subscriptionId) {
      logger.info(
        `User not found by customer ID, trying subscription ID: ${subscriptionId}`,
      );
      const result = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("polar_subscription_id", subscriptionId)
        .single();

      userData = result.data;
      userError = result.error;
    }

    // If still not found, try subscriptions table
    if ((userError || !userData) && subscriptionId) {
      logger.info(
        `User not found in users table, trying subscriptions table: ${subscriptionId}`,
      );
      const result = await supabaseAdmin
        .from("subscriptions")
        .select("user_id")
        .eq("polar_subscription_id", subscriptionId)
        .single();

      if (result.data) {
        const userResult = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("id", result.data.user_id)
          .single();

        userData = userResult.data;
        userError = userResult.error;
      }
    }

    // If still not found and we have customer email, try to find by email
    if ((userError || !userData) && customerEmail) {
      logger.info(
        `User not found by subscription ID, trying email: ${customerEmail}`,
      );
      const result = await supabaseAdmin
        .from("users")
        .select("id, email")
        .eq("email", customerEmail)
        .single();

      userData = result.data;
      userError = result.error;
    }

    if (userError || !userData) {
      logger.error(
        `User not found for subscription: ${subscriptionId}, customerId: ${customerId}, email: ${customerEmail}`,
        userError,
      );
      return;
    }

    // Sync subscription data
    await syncPolarSubscription(userData.id, subscriptionId);

    // Invalidate cache to force refresh on next request
    revalidateTagSafe("subscription-plan");

    logger.info(
      `Successfully synced subscription ${subscriptionId} for user ${userData.id} and invalidated cache`,
    );
  } catch (error: any) {
    logger.error("Error handling subscription updated", error);
    throw error;
  }
}

/**
 * Handle subscription canceled event
 */
async function handleSubscriptionCanceled(data: any) {
  try {
    const subscription = data.object;
    const subscriptionId = subscription.id;

    logger.info(`Subscription canceled: ${subscriptionId}`);

    // Find user by Polar subscription ID
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("polar_subscription_id", subscriptionId)
      .single();

    if (userError || !userData) {
      logger.error(
        `User not found for subscription: ${subscriptionId}`,
        userError,
      );
      return;
    }

    // Update user subscription to canceled
    await updateUserPolarData(userData.id, {
      polar_subscription_id: null,
      polar_product_id: null,
      polar_current_period_end: null,
      payment_provider: "polar",
    });

    // Update subscriptions table
    await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "canceled",
        updated_at: new Date().toISOString(),
      })
      .eq("polar_subscription_id", subscriptionId);
  } catch (error: any) {
    logger.error("Error handling subscription canceled", error);
    throw error;
  }
}

/**
 * Sync Polar subscription data to database
 */
async function syncPolarSubscription(userId: string, subscriptionId: string) {
  try {
    // Fetch subscription details from Polar API
    const isSandbox =
      env.POLAR_USE_SANDBOX === "true" ||
      process.env.POLAR_USE_SANDBOX === "true";
    const apiUrl = isSandbox
      ? "https://sandbox-api.polar.sh/v1"
      : "https://api.polar.sh/v1";
    const accessToken =
      env.POLAR_ACCESS_TOKEN || process.env.POLAR_ACCESS_TOKEN;

    const response = await fetch(`${apiUrl}/subscriptions/${subscriptionId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch subscription: ${response.status}`);
    }

    const subscription = await response.json();

    // Extract subscription data
    const productId = subscription.product_id;
    const customerId = subscription.customer_id;
    const status = subscription.status; // active, canceled, etc.
    const currentPeriodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null;
    const currentPeriodStart = subscription.current_period_start
      ? new Date(subscription.current_period_start * 1000).toISOString()
      : null;

    // Update user table
    await updateUserPolarData(userId, {
      polar_customer_id: customerId,
      polar_subscription_id: subscriptionId,
      polar_product_id: productId,
      polar_current_period_end: currentPeriodEnd,
      payment_provider: "polar",
    });

    // Update or create subscription record
    const { data: existingSub } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("polar_subscription_id", subscriptionId)
      .single();

    const subscriptionData: any = {
      user_id: userId,
      polar_subscription_id: subscriptionId,
      polar_customer_id: customerId,
      polar_product_id: productId,
      status:
        status === "active"
          ? "active"
          : status === "canceled"
            ? "canceled"
            : "past_due",
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      payment_provider: "polar",
      updated_at: new Date().toISOString(),
    };

    if (existingSub) {
      await supabaseAdmin
        .from("subscriptions")
        .update(subscriptionData)
        .eq("id", existingSub.id);
    } else {
      await supabaseAdmin.from("subscriptions").insert(subscriptionData);
    }

    logger.info(
      `Synced Polar subscription ${subscriptionId} for user ${userId}, productId: ${productId}, customerId: ${customerId}, status: ${status}`,
    );
  } catch (error: any) {
    logger.error("Error syncing Polar subscription", error);
    throw error;
  }
}

/**
 * Update user Polar data
 */
async function updateUserPolarData(
  userId: string,
  data: {
    polar_customer_id?: string;
    polar_subscription_id?: string | null;
    polar_product_id?: string | null;
    polar_current_period_end?: string | null;
    payment_provider?: string;
  },
) {
  const { error } = await supabaseAdmin
    .from("users")
    .update(data)
    .eq("id", userId);

  if (error) {
    logger.error("Error updating user Polar data", error);
    throw error;
  }
}
