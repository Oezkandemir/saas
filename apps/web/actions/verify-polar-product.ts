"use server";

import { auth } from "@/auth";

import { supabaseAdmin } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getPolarProduct } from "@/lib/polar";

/**
 * Verify which Polar product ID corresponds to which plan
 * This helps debug plan matching issues
 */
export async function verifyPolarProduct(productId?: string): Promise<{
  success: boolean;
  message: string;
  product?: any;
  userProductId?: string;
}> {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user || !user.id) {
      return { success: false, message: "User not authenticated" };
    }

    // Get user's Polar product ID if not provided
    let productIdToCheck = productId;
    if (!productIdToCheck) {
      const { data: userData, error: userError } = await supabaseAdmin
        .from("users")
        .select("polar_product_id")
        .eq("id", user.id)
        .single();

      if (userError || !userData?.polar_product_id) {
        return {
          success: false,
          message: "No Polar product ID found for user",
        };
      }

      productIdToCheck = userData.polar_product_id;
    }

    // Ensure productIdToCheck is defined
    if (!productIdToCheck) {
      return {
        success: false,
        message: "No Polar product ID available",
      };
    }

    logger.info(`Verifying Polar product: ${productIdToCheck}`);

    // Fetch product details from Polar API
    const product = await getPolarProduct(productIdToCheck);

    logger.info("Product details from Polar", {
      productId: product.id,
      name: product.name,
      description: product.description,
      prices: product.prices,
    });

    return {
      success: true,
      message: "Product verified successfully",
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        prices: product.prices,
      },
      userProductId: productIdToCheck,
    };
  } catch (error: any) {
    logger.error("Error verifying Polar product", error);
    return {
      success: false,
      message: error.message || "Failed to verify product",
    };
  }
}
