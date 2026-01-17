"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";

import { logger } from "@/lib/logger";
import { generatePolarCustomerPortalLink } from "@/lib/polar";

export type responseAction = {
  status: "success" | "error";
  portalUrl?: string;
  message?: string;
};

/**
 * Open Polar customer portal
 * Generates an authenticated portal link and redirects the user
 * Note: redirect() throws a NEXT_REDIRECT exception which should not be caught
 */
export async function openPolarPortal(
  customerId: string
): Promise<responseAction> {
  let portalUrl: string;

  try {
    const session = await auth();

    if (!session?.user || !session?.user.email) {
      logger.error("Cannot open Polar portal: User not authenticated");
      throw new Error("Unauthorized");
    }

    if (!customerId) {
      logger.error("Cannot open Polar portal: No customer ID provided");
      throw new Error("No customer ID provided");
    }

    logger.info(
      `Generating Polar customer portal link for customer: ${customerId}`
    );

    // Generate authenticated portal link
    portalUrl = await generatePolarCustomerPortalLink(customerId);

    logger.info(`Redirecting to Polar portal: ${portalUrl}`);
  } catch (error: any) {
    logger.error("Error opening Polar customer portal", error);

    // Return error instead of throwing to allow client-side handling
    return {
      status: "error",
      message: error.message || "Failed to open customer portal",
    };
  }

  // Call redirect outside of try-catch to allow Next.js to handle the redirect exception properly
  // redirect() throws a NEXT_REDIRECT exception which is expected behavior
  redirect(portalUrl);
}

/**
 * Open Polar customer portal using subscription ID
 * First gets the customer ID from the subscription, then opens the portal
 */
export async function openPolarPortalFromSubscription(
  subscriptionId: string
): Promise<responseAction> {
  try {
    const session = await auth();

    if (!session?.user || !session?.user.email) {
      logger.error("Cannot open Polar portal: User not authenticated");
      throw new Error("Unauthorized");
    }

    if (!subscriptionId) {
      logger.error("Cannot open Polar portal: No subscription ID provided");
      throw new Error("No subscription ID provided");
    }

    logger.info(`Getting customer ID from subscription: ${subscriptionId}`);

    // Get customer ID from subscription
    const { getCustomerIdFromSubscription } = await import("@/lib/polar");
    const customerId = await getCustomerIdFromSubscription(subscriptionId);

    if (!customerId) {
      logger.error(
        "Cannot open Polar portal: No customer ID found in subscription"
      );
      throw new Error("No customer ID found in subscription");
    }

    // Now open portal with the customer ID
    return await openPolarPortal(customerId);
  } catch (error: any) {
    logger.error(
      "Error opening Polar customer portal from subscription",
      error
    );

    return {
      status: "error",
      message: error.message || "Failed to open customer portal",
    };
  }
}

/**
 * Try to open Polar portal by finding customer ID from user data
 * This is a fallback when customer ID is not directly available
 */
export async function openPolarPortalFallback(): Promise<responseAction> {
  try {
    const session = await auth();

    if (!session?.user || !session?.user.id) {
      logger.error("Cannot open Polar portal: User not authenticated");
      throw new Error("Unauthorized");
    }

    // Try to get customer ID from database
    const { supabaseAdmin } = await import("@/lib/db");

    // First, try to get from users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("polar_customer_id, polar_subscription_id, email")
      .eq("id", session.user.id)
      .single();

    logger.info("Fallback: Checking user data", {
      userId: session.user.id,
      hasUserData: !!userData,
      userError: userError?.message,
      polarCustomerId: userData?.polar_customer_id,
      polarSubscriptionId: userData?.polar_subscription_id,
    });

    // Try customer ID from users table first
    if (userData?.polar_customer_id) {
      logger.info("Fallback: Found customer ID in users table");
      return await openPolarPortal(userData.polar_customer_id);
    }

    // Try subscription ID from users table
    if (userData?.polar_subscription_id) {
      logger.info("Fallback: Found subscription ID in users table");
      return await openPolarPortalFromSubscription(
        userData.polar_subscription_id
      );
    }

    // If not found in users table, try subscriptions table
    const { data: subscriptionData, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("polar_customer_id, polar_subscription_id")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    logger.info("Fallback: Checking subscriptions table", {
      hasSubscriptionData: !!subscriptionData,
      subError: subError?.message,
      polarCustomerId: subscriptionData?.polar_customer_id,
      polarSubscriptionId: subscriptionData?.polar_subscription_id,
    });

    if (subscriptionData) {
      // Try customer ID from subscriptions table
      if (subscriptionData.polar_customer_id) {
        logger.info("Fallback: Found customer ID in subscriptions table");
        // Update users table with customer ID for future use
        await supabaseAdmin
          .from("users")
          .update({ polar_customer_id: subscriptionData.polar_customer_id })
          .eq("id", session.user.id);
        return await openPolarPortal(subscriptionData.polar_customer_id);
      }

      // Try subscription ID from subscriptions table
      if (subscriptionData.polar_subscription_id) {
        logger.info("Fallback: Found subscription ID in subscriptions table");
        // Update users table with subscription ID for future use
        await supabaseAdmin
          .from("users")
          .update({
            polar_subscription_id: subscriptionData.polar_subscription_id,
          })
          .eq("id", session.user.id);
        return await openPolarPortalFromSubscription(
          subscriptionData.polar_subscription_id
        );
      }
    }

    // If still not found, try to find customer ID by email from Polar API
    if (session.user.email) {
      logger.info(
        "Fallback: No Polar data found, attempting to find customer by email"
      );

      try {
        const { findCustomerIdByEmail } = await import("@/lib/polar");
        const foundCustomerId = await findCustomerIdByEmail(session.user.email);

        if (foundCustomerId) {
          // Update database with found customer ID
          await supabaseAdmin
            .from("users")
            .update({ polar_customer_id: foundCustomerId })
            .eq("id", session.user.id);

          logger.info("Fallback: Found customer ID by email, opening portal");
          return await openPolarPortal(foundCustomerId);
        }
      } catch (emailSearchError: any) {
        logger.error(
          "Fallback: Error searching for customer by email",
          emailSearchError
        );
      }
    }

    // If still not found, subscriptions will be synced automatically via webhooks
    logger.info(
      "No Polar data found - subscription will be synced automatically via webhooks"
    );

    // Return error - user needs to wait for webhook or complete checkout
    logger.error("No Polar data found after all attempts", {
      userId: session.user.id,
      userEmail: session.user.email,
      userData: userData,
      subscriptionData: subscriptionData,
    });

    // Return error with helpful message
    return {
      status: "error",
      message:
        "No Polar subscription found. Please ensure you have completed a purchase through Polar.sh. Subscriptions are synced automatically via webhooks.",
    };
  } catch (error: any) {
    logger.error("Error opening Polar customer portal (fallback)", error);

    return {
      status: "error",
      message: error.message || "Failed to open customer portal",
    };
  }
}
