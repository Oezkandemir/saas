"use server";

import { auth } from "@/auth";
import { env } from "@/env.mjs";
import { supabaseAdmin } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Fix missing Polar subscription data by fetching from Polar API
 * This can be called manually to sync subscription data
 */
export async function fixPolarSubscription(): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user || !user.id) {
      return { success: false, message: "User not authenticated" };
    }

    // Get user's Polar customer ID and email
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("polar_customer_id, polar_product_id, polar_subscription_id, email")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return { success: false, message: "User not found" };
    }

    // If no customer ID, try to find it by email
    let customerId = userData.polar_customer_id;
    if (!customerId && userData.email) {
      logger.info(`No customer ID found, searching by email: ${userData.email}`);
      const { findCustomerIdByEmail } = await import("@/lib/polar");
      customerId = await findCustomerIdByEmail(userData.email);
      
      if (customerId) {
        // Update database with found customer ID
        await supabaseAdmin
          .from("users")
          .update({ polar_customer_id: customerId })
          .eq("id", user.id);
        logger.info(`Found and saved customer ID: ${customerId}`);
      }
    }

    if (!customerId) {
      return { success: false, message: "No Polar customer ID found. Please ensure you have completed a purchase." };
    }

    logger.info(`Fixing Polar subscription for user ${user.id}`, {
      customerId: customerId,
      productId: userData.polar_product_id,
      subscriptionId: userData.polar_subscription_id,
    });

    // Fetch customer subscriptions from Polar API
    const isSandbox = env.POLAR_USE_SANDBOX === "true" || process.env.POLAR_USE_SANDBOX === "true";
    const apiUrl = isSandbox ? "https://sandbox-api.polar.sh/v1" : "https://api.polar.sh/v1";
    const accessToken = env.POLAR_ACCESS_TOKEN || process.env.POLAR_ACCESS_TOKEN;

    // Get customer details
    const customerResponse = await fetch(`${apiUrl}/customers/${customerId}`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!customerResponse.ok) {
      return {
        success: false,
        message: `Failed to fetch customer: ${customerResponse.statusText}`,
      };
    }

    const customer = await customerResponse.json();

    // Get active subscriptions for this customer
    const subscriptionsResponse = await fetch(`${apiUrl}/subscriptions?customer_id=${customerId}`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!subscriptionsResponse.ok) {
      return {
        success: false,
        message: `Failed to fetch subscriptions: ${subscriptionsResponse.statusText}`,
      };
    }

    const subscriptionsData = await subscriptionsResponse.json();
    const subscriptions = subscriptionsData.items || subscriptionsData || [];

    logger.info(`Found ${subscriptions.length} subscriptions for customer ${customerId}`, {
      subscriptions: subscriptions.map((sub: any) => ({
        id: sub.id,
        status: sub.status,
        product_id: sub.product_id,
      })),
    });

    // Find active subscription
    const activeSubscription = subscriptions.find((sub: any) => 
      sub.status === "active" || sub.status === "trialing"
    );

    if (activeSubscription) {
      logger.info(`Found active subscription: ${activeSubscription.id}`, {
        status: activeSubscription.status,
        product_id: activeSubscription.product_id,
        current_period_end: activeSubscription.current_period_end,
        current_period_start: activeSubscription.current_period_start,
      });
    }

    if (!activeSubscription) {
      // If no active subscription but we have a product_id, it might be a one-time purchase
      if (userData.polar_product_id) {
        logger.info("No active subscription found, but product_id exists - treating as one-time purchase");
        return {
          success: true,
          message: "Product purchase found (no subscription)",
        };
      }
      return {
        success: false,
        message: "No active subscription found in Polar",
      };
    }

    // Update user with subscription data
    // Handle different timestamp formats from Polar API
    let currentPeriodEnd: string | null = null;
    let currentPeriodStart: string | null = null;

    if (activeSubscription.current_period_end) {
      try {
        // Check if it's already an ISO string
        if (typeof activeSubscription.current_period_end === 'string') {
          // Validate it's a valid date string
          const date = new Date(activeSubscription.current_period_end);
          if (!isNaN(date.getTime())) {
            currentPeriodEnd = date.toISOString();
          }
        } else if (typeof activeSubscription.current_period_end === 'number') {
          // Unix timestamp (seconds)
          const date = new Date(activeSubscription.current_period_end * 1000);
          if (!isNaN(date.getTime())) {
            currentPeriodEnd = date.toISOString();
          }
        }
      } catch (error) {
        logger.warn("Error parsing current_period_end", { 
          value: activeSubscription.current_period_end,
          error 
        });
      }
    }

    if (activeSubscription.current_period_start) {
      try {
        // Check if it's already an ISO string
        if (typeof activeSubscription.current_period_start === 'string') {
          // Validate it's a valid date string
          const date = new Date(activeSubscription.current_period_start);
          if (!isNaN(date.getTime())) {
            currentPeriodStart = date.toISOString();
          }
        } else if (typeof activeSubscription.current_period_start === 'number') {
          // Unix timestamp (seconds)
          const date = new Date(activeSubscription.current_period_start * 1000);
          if (!isNaN(date.getTime())) {
            currentPeriodStart = date.toISOString();
          }
        }
      } catch (error) {
        logger.warn("Error parsing current_period_start", { 
          value: activeSubscription.current_period_start,
          error 
        });
      }
    }

    const { error: userUpdateError } = await supabaseAdmin
      .from("users")
      .update({
        polar_customer_id: customerId, // Ensure customer ID is set (might have been found by email)
        polar_subscription_id: activeSubscription.id,
        polar_product_id: activeSubscription.product_id || userData.polar_product_id,
        polar_current_period_end: currentPeriodEnd,
        // Note: polar_current_period_start is stored in subscriptions table, not users table
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
      polar_subscription_id: activeSubscription.id,
      polar_customer_id: customerId, // Use the resolved customerId (might have been found by email)
      polar_product_id: activeSubscription.product_id || userData.polar_product_id,
      status: activeSubscription.status === "active" ? "active" : "past_due",
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      payment_provider: "polar",
      updated_at: new Date().toISOString(),
    };

    // Check if subscription already exists
    const { data: existingSub } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("polar_subscription_id", activeSubscription.id)
      .single();

    if (existingSub) {
      await supabaseAdmin
        .from("subscriptions")
        .update(subscriptionData)
        .eq("id", existingSub.id);
    } else {
      await supabaseAdmin
        .from("subscriptions")
        .insert(subscriptionData);
    }

    logger.info(`Successfully fixed Polar subscription ${activeSubscription.id} for user ${user.id}`);
    return {
      success: true,
      message: "Subscription synced successfully",
    };
  } catch (error: any) {
    logger.error("Error fixing Polar subscription", error);
    return {
      success: false,
      message: error.message || "Failed to sync subscription",
    };
  }
}


