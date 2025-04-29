"use server";

import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { absoluteUrl } from "@/lib/utils";
import { redirect } from "next/navigation";
import { syncUserWithDatabase } from "@/lib/auth-sync";
import { env } from "@/env.mjs";

export type responseAction = {
  status: "success" | "error";
  stripeUrl?: string;
}

// Update the billingUrl to always point to the dashboard billing page
const billingUrl = absoluteUrl("/dashboard/billing");
// Direct link to the test customer portal
const stripeTestPortalUrl = "https://billing.stripe.com/p/login/test_14kcMTbsj2hdbgQ288";

export async function generateUserStripe(priceId: string): Promise<responseAction> {
  let redirectUrl: string = "";

  try {
    const session = await auth()
    const user = session?.user;

    if (!user || !user.email || !user.id) {
      console.error("Unauthorized: User not authenticated");
      throw new Error("Unauthorized");
    }

    // First ensure the user exists in the database
    console.log(`Ensuring user ${user.id} exists in database...`);
    const syncResult = await syncUserWithDatabase({
      id: user.id,
      email: user.email,
      user_metadata: { name: user.name }
    } as any);
    
    if (!syncResult) {
      console.error(`Failed to sync user ${user.id} with database`);
      // Continue anyway, getUserSubscriptionPlan should handle missing users
    } else {
      console.log(`User sync result: ${JSON.stringify(syncResult)}`);
    }

    console.log(`Fetching subscription plan for user ${user.id}`);
    const subscriptionPlan = await getUserSubscriptionPlan(user.id, user.email)
    
    if (!subscriptionPlan) {
      console.error(`Failed to get subscription plan for user ${user.id}`);
      throw new Error("Failed to get subscription plan");
    }

    if (!env.STRIPE_API_KEY || env.STRIPE_API_KEY.length === 0) {
      console.error("Stripe API key is not set or is empty");
      throw new Error("Stripe is not configured");
    }

    if (subscriptionPlan.isPaid && subscriptionPlan.stripeCustomerId) {
      console.log(`Creating billing portal for paid user ${user.id} with customer ID ${subscriptionPlan.stripeCustomerId}`);
      
      // In non-production environments, always use the test portal URL
      if (process.env.NODE_ENV !== "production") {
        console.log(`Using test portal URL: ${stripeTestPortalUrl}`);
        redirectUrl = stripeTestPortalUrl;
      } else {
        // In production, create a real portal session
        console.log("Creating real Stripe portal session for production environment");
        const stripeSession = await stripe.billingPortal.sessions.create({
          customer: subscriptionPlan.stripeCustomerId,
          return_url: billingUrl,
        });

        redirectUrl = stripeSession.url as string;
      }
      
      console.log(`Created billing portal session, redirecting to: ${redirectUrl}`);
    } else {
      console.log(`Creating checkout session for user ${user.id} with email ${user.email} for price ID ${priceId}`);
      // User on Free Plan - Create a checkout session to upgrade.
      
      // Check if price ID is valid
      if (!priceId) {
        console.error("No price ID provided");
        throw new Error("Invalid price ID");
      }
      
      // Validate that the priceId is a valid Stripe price ID format (starts with 'price_')
      if (!priceId.startsWith('price_')) {
        console.error(`Invalid price ID format: ${priceId}. Price IDs must start with 'price_', not 'prod_'`);
        throw new Error("Invalid price ID format. Price IDs must start with 'price_'");
      }
      
      const stripeSession = await stripe.checkout.sessions.create({
        success_url: billingUrl,
        cancel_url: billingUrl,
        payment_method_types: ["card"],
        mode: "subscription",
        billing_address_collection: "auto",
        customer_email: user.email,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        metadata: {
          userId: user.id,
        },
      })

      redirectUrl = stripeSession.url as string;
      console.log(`Created checkout session, redirecting to: ${redirectUrl}`);
    }
    
    if (!redirectUrl) {
      console.error("Failed to generate Stripe URL");
      throw new Error("Failed to generate Stripe URL");
    }
    
    console.log(`Redirecting user to ${redirectUrl}`);
  } catch (error: any) {
    console.error("Error generating Stripe session:", error);
    throw new Error(error.message || "Failed to generate Stripe session");
  }

  redirect(redirectUrl);
}