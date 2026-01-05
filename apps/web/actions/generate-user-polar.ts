"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { env } from "@/env.mjs";
import { absoluteUrl } from "@/lib/utils";
import { logger } from "@/lib/logger";

export type responseAction = {
  status: "success" | "error";
  polarUrl?: string;
};

/**
 * Generate Polar checkout session for user
 * This redirects the user to Polar's checkout page with the specified product
 * 
 * @param productId - The Polar product ID to checkout
 * @returns Promise that redirects to Polar checkout
 */
export async function generateUserPolar(
  productId: string,
): Promise<responseAction> {
  let checkoutUrl: string = "";

  try {
    const session = await auth();
    const user = session?.user;

    if (!user || !user.email || !user.id) {
      logger.error("Unauthorized: User not authenticated");
      throw new Error("Unauthorized");
    }

    if (!env.POLAR_ACCESS_TOKEN || env.POLAR_ACCESS_TOKEN.length === 0) {
      logger.error("Polar access token is not set or is empty");
      throw new Error("Polar is not configured. Please set POLAR_ACCESS_TOKEN in your environment variables.");
    }

    if (!productId) {
      logger.error("No product ID provided");
      throw new Error("Invalid product ID");
    }

    logger.info(
      `Creating Polar checkout for user ${user.id} with email ${user.email} for product ID ${productId}`,
    );

    // Construct the Polar checkout URL with products query parameter and user info
    // Polar.sh expects 'products' parameter (not 'product_id')
    const params = new URLSearchParams({
      products: productId,
      customer_email: user.email,
    });
    
    // Add customer name if available
    if (user.name) {
      params.append("customer_name", user.name);
    }
    
    checkoutUrl = `${absoluteUrl("/api/checkout/polar")}?${params.toString()}`;

    logger.info(`Redirecting to Polar checkout: ${checkoutUrl}`);
  } catch (error: any) {
    logger.error("Error generating Polar checkout session", {
      error: error.message,
      productId: productId,
    });

    // If error message already contains helpful information, use it
    if (error.message?.includes("not configured") || error.message?.includes("Invalid")) {
      throw error;
    }

    throw new Error(error.message || "Failed to generate Polar checkout session");
  }

  // Call redirect outside of try-catch to allow Next.js to handle the redirect exception properly
  redirect(checkoutUrl);
}

