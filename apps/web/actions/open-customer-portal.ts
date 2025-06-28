"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";

import { stripe } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";

export type responseAction = {
  status: "success" | "error";
  stripeUrl?: string;
  message?: string;
};

const billingUrl = absoluteUrl("/dashboard/billing");
// Direct link to the test customer portal
const stripeTestPortalUrl =
  "https://billing.stripe.com/p/login/test_14kcMTbsj2hdbgQ288";

export async function openCustomerPortal(
  userStripeId: string,
): Promise<responseAction> {
  try {
    const session = await auth();

    if (!session?.user || !session?.user.email) {
      console.error("Cannot open customer portal: User not authenticated");
      throw new Error("Unauthorized");
    }

    console.log(`Redirecting to Stripe test portal: ${stripeTestPortalUrl}`);

    // In test mode, always use the test portal URL
    if (process.env.NODE_ENV !== "production") {
      redirect(stripeTestPortalUrl);
      return { status: "success" }; // This line will never execute due to redirect
    }

    // In production mode, create a real portal session
    console.log(
      `Attempting to create Stripe portal session for customer: ${userStripeId}`,
    );

    if (!userStripeId) {
      console.error("Cannot open customer portal: No customer ID provided");
      throw new Error("No customer ID provided");
    }

    try {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: userStripeId,
        return_url: billingUrl,
      });

      console.log(
        `Successfully created Stripe portal session, URL: ${stripeSession.url}`,
      );
      redirect(stripeSession.url as string);
    } catch (stripeError: any) {
      console.error(
        `Stripe error creating portal session: ${stripeError.message}`,
      );

      // If the customer ID is invalid or doesn't exist, try to find the correct one
      if (
        stripeError.code === "resource_missing" &&
        stripeError.message.includes("Customer")
      ) {
        console.log(
          `Customer ${userStripeId} not found in Stripe, trying to find by email: ${session.user.email}`,
        );

        // Try to look up the customer by email
        const customers = await stripe.customers.list({
          email: session.user.email,
          limit: 1,
        });

        if (customers.data.length > 0) {
          const correctCustomerId = customers.data[0].id;
          console.log(`Found customer by email with ID: ${correctCustomerId}`);

          // Create portal session with the correct customer ID
          const stripeSession = await stripe.billingPortal.sessions.create({
            customer: correctCustomerId,
            return_url: billingUrl,
          });

          console.log(
            `Successfully created Stripe portal session with corrected ID`,
          );
          redirect(stripeSession.url as string);
        } else {
          // If all else fails, redirect to the test portal in non-production environments
          if (process.env.NODE_ENV !== "production") {
            console.log(`Falling back to test portal: ${stripeTestPortalUrl}`);
            redirect(stripeTestPortalUrl);
          } else {
            throw new Error("Customer not found in Stripe");
          }
        }
      } else {
        // For any other errors in non-production, redirect to test portal
        if (process.env.NODE_ENV !== "production") {
          console.log(
            `Redirecting to test portal due to error: ${stripeTestPortalUrl}`,
          );
          redirect(stripeTestPortalUrl);
        } else {
          throw stripeError;
        }
      }
    }
  } catch (error: any) {
    console.error(
      `Failed to generate Stripe customer portal: ${error.message}`,
    );

    // In test/development, redirect to the test portal as a fallback
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `Redirecting to test portal after error: ${stripeTestPortalUrl}`,
      );
      redirect(stripeTestPortalUrl);
    }

    return {
      status: "error",
      message: error.message || "Failed to generate user stripe session",
    };
  }

  // We should never reach here due to redirects, but just in case, redirect to billing
  redirect(billingUrl);
}
