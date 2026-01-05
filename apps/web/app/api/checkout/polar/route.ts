import { NextRequest, NextResponse } from "next/server";

import { env } from "@/env.mjs";
import { logger } from "@/lib/logger";
import { createPolarCheckout } from "@/lib/polar";

/**
 * Polar.sh Checkout Route
 * Handles checkout sessions for Polar.sh payments via direct API calls
 * This gives us more control over the checkout configuration
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const products = searchParams.get("products");
  const customerEmail = searchParams.get("customer_email");
  const customerName = searchParams.get("customer_name");

  if (!products) {
    return NextResponse.json(
      { error: "Missing products in query params" },
      { status: 400 },
    );
  }

  const successUrl =
    env.POLAR_SUCCESS_URL ||
    process.env.POLAR_SUCCESS_URL ||
    `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing?checkout_id={CHECKOUT_ID}`;

  try {
    logger.info(`Creating Polar checkout for products: ${products}`, {
      customerEmail,
      customerName,
    });

    // Create checkout session via Polar.sh API
    const checkoutData = await createPolarCheckout({
      products: [products],
      successUrl,
      customerEmail: customerEmail || undefined,
      customerName: customerName || undefined,
    });

    // Redirect to Polar checkout URL
    if (checkoutData.url) {
      logger.info(`Redirecting to Polar checkout: ${checkoutData.url}`);
      return NextResponse.redirect(checkoutData.url);
    }

    logger.error("No checkout URL returned from Polar.sh", checkoutData);
    return NextResponse.json(
      { error: "No checkout URL returned from Polar.sh" },
      { status: 500 },
    );
  } catch (error: any) {
    logger.error("Error creating Polar checkout", error);

    // Provide helpful error message
    const errorMessage = error.message || "Failed to create checkout session";

    // Check if it's a payment setup issue
    if (
      errorMessage.includes("payment") ||
      errorMessage.includes("unavailable")
    ) {
      return NextResponse.json(
        {
          error: "Payment setup incomplete",
          message:
            "Please complete the payment setup in your Polar.sh dashboard. Go to Settings > Payment Methods and connect a payment provider (e.g., Stripe).",
          details: errorMessage,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        message: errorMessage,
      },
      { status: 500 },
    );
  }
}
