"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";

import { stripe } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";

export type ConfigResponse = {
  success: boolean;
  message: string;
  details?: any;
};

/**
 * Creates or updates a Stripe Customer Portal configuration to enable
 * subscription management features
 */
export async function configureStripePortal(): Promise<ConfigResponse> {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return {
        success: false,
        message: "Unauthorized: User not authenticated",
      };
    }

    // First get the list of existing portal configurations
    const configurations = await stripe.billingPortal.configurations.list({
      limit: 10,
    });

    const billingReturnUrl = absoluteUrl("/dashboard/billing");

    // If there's an existing configuration, update it
    if (configurations.data.length > 0) {
      const existingConfig = configurations.data[0];

      console.log(
        `Updating existing Stripe portal configuration: ${existingConfig.id}`,
      );

      const updatedConfig = await stripe.billingPortal.configurations.update(
        existingConfig.id,
        {
          business_profile: {
            headline: "Manage your subscription",
          },
          features: {
            subscription_update: {
              enabled: true,
              default_allowed_updates: ["price", "quantity", "promotion_code"],
              products: [],
              proration_behavior: "create_prorations",
            },
            subscription_cancel: {
              enabled: true,
              mode: "at_period_end",
              cancellation_reason: {
                enabled: true,
                options: [
                  "too_expensive",
                  "missing_features",
                  "switched_service",
                  "unused",
                  "other",
                ],
              },
            },
            customer_update: {
              enabled: true,
              allowed_updates: [
                "email",
                "address",
                "shipping",
                "phone",
                "tax_id",
              ],
            },
            invoice_history: {
              enabled: true,
            },
            payment_method_update: {
              enabled: true,
            },
          },
        },
      );

      return {
        success: true,
        message: "Successfully updated Stripe portal configuration",
        details: {
          configId: updatedConfig.id,
          updatedAt: new Date().toISOString(),
        },
      };
    } else {
      // Create a new configuration if none exists
      console.log("Creating new Stripe portal configuration");

      const newConfig = await stripe.billingPortal.configurations.create({
        business_profile: {
          headline: "Manage your subscription",
          privacy_policy_url: absoluteUrl("/privacy"),
          terms_of_service_url: absoluteUrl("/terms"),
        },
        features: {
          subscription_update: {
            enabled: true,
            default_allowed_updates: ["price", "quantity", "promotion_code"],
            products: [],
            proration_behavior: "create_prorations",
          },
          subscription_cancel: {
            enabled: true,
            mode: "at_period_end",
            cancellation_reason: {
              enabled: true,
              options: [
                "too_expensive",
                "missing_features",
                "switched_service",
                "unused",
                "other",
              ],
            },
          },
          customer_update: {
            enabled: true,
            allowed_updates: [
              "email",
              "address",
              "shipping",
              "phone",
              "tax_id",
            ],
          },
          invoice_history: {
            enabled: true,
          },
          payment_method_update: {
            enabled: true,
          },
        },
        default_return_url: billingReturnUrl,
      });

      return {
        success: true,
        message: "Successfully created new Stripe portal configuration",
        details: {
          configId: newConfig.id,
          createdAt: new Date().toISOString(),
        },
      };
    }
  } catch (error: any) {
    console.error("Error configuring Stripe portal:", error);

    return {
      success: false,
      message: error.message || "Failed to configure Stripe portal",
      details: {
        errorCode: error.code,
        errorType: error.type,
      },
    };
  }
}
