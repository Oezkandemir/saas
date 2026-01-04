import Stripe from "stripe";

import { env } from "@/env.mjs";
import { logger } from "./logger";

// Stripe is deprecated - we now use Polar.sh for payments
// This file is kept for backward compatibility but Stripe is no longer initialized

// Create Stripe instance (disabled - using Polar instead)
let stripeInstance: Stripe | null = null;

// Stripe initialization is disabled - we use Polar.sh now
// Uncomment the code below only if you need Stripe for legacy reasons
/*
try {
  if (env.STRIPE_API_KEY && env.STRIPE_API_KEY.length > 0) {
    stripeInstance = new Stripe(env.STRIPE_API_KEY, {
      apiVersion: "2024-04-10",
      typescript: true,
    });
    logger.info("Stripe initialized successfully");
  } else {
    logger.warn("Stripe not initialized: Using Polar.sh instead");
  }
} catch (error) {
  logger.error("Error initializing Stripe", error);
}
*/

// Export a proxy object that will show clear errors if Stripe is used
export const stripe = new Proxy(stripeInstance || ({} as Stripe), {
  get(target, prop) {
    // Stripe is deprecated - throw error if someone tries to use it
    throw new Error(
      "Stripe is deprecated. This application now uses Polar.sh for payments. Please use Polar.sh APIs instead.",
    );
  },
});
