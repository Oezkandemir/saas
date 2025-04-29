import Stripe from "stripe"

import { env } from "@/env.mjs"

// Check if Stripe API key is defined
if (!env.STRIPE_API_KEY) {
  console.error("⚠️ Stripe API key is not defined. Please set STRIPE_API_KEY in your environment variables.");
}

// Create Stripe instance with more detailed error handling
let stripeInstance: Stripe | null = null;

try {
  if (env.STRIPE_API_KEY && env.STRIPE_API_KEY.length > 0) {
    stripeInstance = new Stripe(env.STRIPE_API_KEY, {
      apiVersion: "2024-04-10",
      typescript: true,
    });
    console.log("✅ Stripe initialized successfully");
  } else {
    console.error("⚠️ Stripe not initialized: API key is empty or invalid");
  }
} catch (error) {
  console.error("⚠️ Error initializing Stripe:", error);
}

// Export a proxy object that will show clear errors if Stripe is not initialized
export const stripe = new Proxy(stripeInstance || {} as Stripe, {
  get(target, prop) {
    // If Stripe is not initialized, throw a clear error
    if (!stripeInstance) {
      throw new Error(
        "Stripe not initialized. Please check that STRIPE_API_KEY is correctly set in your environment variables."
      );
    }
    return (target as any)[prop];
  },
});
