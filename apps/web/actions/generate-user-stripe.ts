"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";

import { env } from "@/env.mjs";
import { syncUserWithDatabase } from "@/lib/auth-sync";
import { stripe } from "@/lib/stripe";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { absoluteUrl } from "@/lib/utils";
import { logger } from "@/lib/logger";

export type responseAction = {
  status: "success" | "error";
  stripeUrl?: string;
};

// Update the billingUrl to always point to the dashboard billing page
const billingUrl = absoluteUrl("/dashboard/billing");
// Direct link to the test customer portal
const stripeTestPortalUrl =
  "https://billing.stripe.com/p/login/test_14kcMTbsj2hdbgQ288";

export async function generateUserStripe(
  priceId: string,
): Promise<responseAction> {
  let redirectUrl: string = "";

  try {
    const session = await auth();
    const user = session?.user;

    if (!user || !user.email || !user.id) {
      logger.error("Unauthorized: User not authenticated");
      throw new Error("Unauthorized");
    }

    // First ensure the user exists in the database
    logger.debug(`Ensuring user ${user.id} exists in database...`);
    const syncResult = await syncUserWithDatabase({
      id: user.id,
      email: user.email,
      user_metadata: { name: user.name },
    } as any);

    if (!syncResult) {
      logger.error(`Failed to sync user ${user.id} with database`);
      // Continue anyway, getUserSubscriptionPlan should handle missing users
    } else {
      logger.debug(`User sync result`, { syncResult });
    }

    logger.debug(`Fetching subscription plan for user ${user.id}`);
    const subscriptionPlan = await getUserSubscriptionPlan(user.id, user.email);

    if (!subscriptionPlan) {
      logger.error(`Failed to get subscription plan for user ${user.id}`);
      throw new Error("Failed to get subscription plan");
    }

    if (!env.STRIPE_API_KEY || env.STRIPE_API_KEY.length === 0) {
      logger.error("Stripe API key is not set or is empty");
      throw new Error("Stripe is not configured");
    }

    if (subscriptionPlan.isPaid && subscriptionPlan.stripeCustomerId) {
      logger.info(
        `Creating billing portal for paid user ${user.id} with customer ID ${subscriptionPlan.stripeCustomerId}`,
      );

      // In non-production environments, always use the test portal URL
      if (process.env.NODE_ENV !== "production") {
        logger.debug(`Using test portal URL: ${stripeTestPortalUrl}`);
        redirectUrl = stripeTestPortalUrl;
      } else {
        // In production, create a real portal session
        logger.info(
          "Creating real Stripe portal session for production environment",
        );
        const stripeSession = await stripe.billingPortal.sessions.create({
          customer: subscriptionPlan.stripeCustomerId,
          return_url: billingUrl,
        });

        redirectUrl = stripeSession.url as string;
      }

      logger.info(
        `Created billing portal session, redirecting to: ${redirectUrl}`,
      );
    } else {
      logger.info(
        `Creating checkout session for user ${user.id} with email ${user.email} for price ID ${priceId}`,
      );
      // User on Free Plan - Create a checkout session to upgrade.

      // Check if price ID is valid
      if (!priceId) {
        logger.error("No price ID provided");
        throw new Error("Invalid price ID");
      }

      // Validate that the priceId is a valid Stripe price ID format (starts with 'price_')
      if (!priceId.startsWith("price_")) {
        const errorMessage = priceId.startsWith("prod_")
          ? `Sie verwenden eine Product ID (${priceId}) statt einer Price ID. Gehen Sie zu Stripe Dashboard > Products > [Ihr Produkt] > Pricing und kopieren Sie die Price ID (beginnt mit 'price_'). Siehe STRIPE-PRICE-IDS-SETUP.md für Details.`
          : `Ungültige Price ID: ${priceId}. Price IDs müssen mit 'price_' beginnen.`;
        
        logger.error(`Invalid price ID format: ${priceId}. ${errorMessage}`);
        throw new Error(errorMessage);
      }

      // First verify the price exists
      try {
        // Log which Price ID we're trying to use for debugging
        logger.info(`Verifying Price ID: ${priceId}`);
        
        // Check if this Price ID matches any of our configured environment variables
        const configuredPriceIds = [
          env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID,
          env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID,
          env.NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID,
          env.NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID,
        ].filter(Boolean);
        
        if (!configuredPriceIds.includes(priceId)) {
          logger.warn(
            `Price ID ${priceId} is not found in configured environment variables. ` +
            `Configured IDs: ${configuredPriceIds.join(', ')}`
          );
        }
        
        const price = await stripe.prices.retrieve(priceId);
        if (!price.active) {
          logger.warn(`Price ${priceId} exists but is not active`);
        }
        logger.debug(`Price verified: ${priceId} - ${price.unit_amount ? (price.unit_amount / 100).toFixed(2) : 'N/A'} ${price.currency}`);
      } catch (priceError: any) {
        if (priceError.code === 'resource_missing') {
          logger.error(`Price ID ${priceId} does not exist in Stripe`);
          
          // Check if we're using test or live mode
          const isTestMode = env.STRIPE_API_KEY?.startsWith('sk_test_');
          const mode = isTestMode ? 'Test' : 'Live';
          
          // Build helpful error message
          let errorMessage = `Die Price ID "${priceId}" existiert nicht in Ihrem Stripe ${mode}-Account.\n\n`;
          errorMessage += `Mögliche Ursachen:\n`;
          errorMessage += `1. Die Price ID wurde gelöscht oder archiviert\n`;
          errorMessage += `2. Sie verwenden einen anderen Stripe Account (${mode}-Modus)\n`;
          errorMessage += `3. Die Price ID stammt aus einem anderen Stripe Account\n\n`;
          errorMessage += `Lösung:\n`;
          errorMessage += `1. Gehen Sie zu Stripe Dashboard (${mode}-Modus) > Products\n`;
          errorMessage += `2. Wählen Sie Ihr Produkt aus\n`;
          errorMessage += `3. Scrollen Sie zu "Pricing"\n`;
          errorMessage += `4. Kopieren Sie die aktuelle Price ID (beginnt mit 'price_')\n`;
          errorMessage += `5. Aktualisieren Sie die entsprechende Variable in .env.local\n`;
          errorMessage += `6. Starten Sie den Server neu\n\n`;
          errorMessage += `Verwenden Sie das Script: node scripts/get-stripe-price-ids.js`;
          
          throw new Error(errorMessage);
        }
        throw priceError;
      }

      const stripeSession = await stripe.checkout.sessions.create({
        success_url: `${billingUrl}?session_id={CHECKOUT_SESSION_ID}`,
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
      });

      redirectUrl = stripeSession.url as string;
      logger.info(`Created checkout session, redirecting to: ${redirectUrl}`);
    }

    if (!redirectUrl) {
      logger.error("Failed to generate Stripe URL");
      throw new Error("Failed to generate Stripe URL");
    }

    logger.info(`Redirecting user to ${redirectUrl}`);
  } catch (error: any) {
    logger.error("Error generating Stripe session", {
      error: error.message,
      code: error.code,
      type: error.type,
      priceId: priceId,
    });
    
    // If error message already contains helpful information, use it
    if (error.message?.includes("existiert nicht") || error.message?.includes("does not exist")) {
      throw error;
    }
    
    // Provide more helpful error messages
    if (error.message?.includes("No such price") || error.code === "resource_missing") {
      const isTestMode = env.STRIPE_API_KEY?.startsWith('sk_test_');
      const mode = isTestMode ? 'Test' : 'Live';
      
      throw new Error(
        `Die Price ID "${priceId}" existiert nicht in Ihrem Stripe ${mode}-Account.\n\n` +
        `Bitte überprüfen Sie:\n` +
        `1. Stripe Dashboard (${mode}-Modus) > Products > [Ihr Produkt] > Pricing\n` +
        `2. Kopieren Sie die aktuelle Price ID\n` +
        `3. Aktualisieren Sie .env.local\n` +
        `4. Starten Sie den Server neu\n\n` +
        `Siehe ENV-VARIABLEN-SETUP.md für Anweisungen.`
      );
    }
    
    if (error.type === "StripeInvalidRequestError") {
      throw new Error(
        `Stripe Fehler: ${error.message}\n\n` +
        `Überprüfen Sie:\n` +
        `- Ob die Price ID korrekt ist\n` +
        `- Ob die Price ID in Ihrem Stripe Account existiert\n` +
        `- Ob Sie den richtigen Stripe-Modus verwenden (Test/Live)`
      );
    }
    
    throw new Error(error.message || "Failed to generate Stripe session");
  }

  redirect(redirectUrl);
}
