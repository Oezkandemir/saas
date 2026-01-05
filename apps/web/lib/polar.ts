import { env } from "@/env.mjs";

import { logger } from "./logger";

// Use sandbox API if POLAR_USE_SANDBOX is enabled
const isSandbox =
  env.POLAR_USE_SANDBOX === "true" || process.env.POLAR_USE_SANDBOX === "true";
const POLAR_API_BASE_URL = isSandbox
  ? "https://sandbox-api.polar.sh/v1"
  : "https://api.polar.sh/v1";

const POLAR_DASHBOARD_BASE_URL = isSandbox
  ? "https://sandbox.polar.sh"
  : "https://polar.sh";

// Log which environment is being used
if (isSandbox) {
  logger.info("🌵 Using Polar.sh SANDBOX environment for testing");
} else {
  logger.info("🚀 Using Polar.sh PRODUCTION environment");
}

/**
 * Get Polar.sh API client
 */
function getPolarHeaders() {
  const accessToken = env.POLAR_ACCESS_TOKEN || process.env.POLAR_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("POLAR_ACCESS_TOKEN is not configured");
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

/**
 * Get organization slug/name from Polar API
 * This is needed to construct the correct portal URL
 */
async function getPolarOrganizationSlug(): Promise<string> {
  try {
    const headers = getPolarHeaders();
    const response = await fetch(`${POLAR_API_BASE_URL}/organizations`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch organizations: ${response.status}`);
    }

    const data = await response.json();
    const organizations = data.items || data;

    if (!organizations || organizations.length === 0) {
      throw new Error("No organizations found");
    }

    // Use the first organization's slug
    const orgSlug = organizations[0]?.slug || organizations[0]?.name;
    if (!orgSlug) {
      throw new Error("Organization slug not found");
    }

    return orgSlug;
  } catch (error: any) {
    logger.error("Error fetching Polar organization", error);
    throw error;
  }
}

/**
 * Generate Polar customer portal link with session token
 * This creates an authenticated link that allows customers to access their portal without logging in
 * @param customerId - The Polar customer ID
 * @returns Customer portal URL with session token
 */
export async function generatePolarCustomerPortalLink(
  customerId: string,
): Promise<string> {
  try {
    if (!customerId) {
      throw new Error("Customer ID is required");
    }

    const headers = getPolarHeaders();

    logger.info(`Creating customer session for customer: ${customerId}`);

    // Create customer session via Polar API
    const response = await fetch(`${POLAR_API_BASE_URL}/customer-sessions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        customer_id: customerId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || `HTTP ${response.status}` };
      }

      logger.error("Failed to create Polar customer session", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });

      throw new Error(
        errorData.error?.message ||
          errorData.error ||
          errorData.detail ||
          `HTTP ${response.status}: Failed to create customer session`,
      );
    }

    const sessionData = await response.json();

    logger.info("Customer session created", {
      hasToken: !!sessionData.token,
      hasPortalUrl: !!sessionData.customer_portal_url,
    });

    // Return the customer portal URL if API provides it directly
    if (sessionData.customer_portal_url) {
      logger.info(
        `Generated Polar customer portal link for customer ${customerId}`,
      );
      return sessionData.customer_portal_url;
    }

    // If API doesn't return portal URL, construct it manually
    if (!sessionData.token) {
      throw new Error("No session token returned from Polar API");
    }

    // Get organization slug dynamically
    let orgSlug: string;
    try {
      orgSlug = await getPolarOrganizationSlug();
    } catch (error: any) {
      logger.warn("Failed to get organization slug, using fallback", error);
      // Fallback: try to get from env or use default
      const envOrgSlug =
        env.POLAR_ORGANIZATION_SLUG || process.env.POLAR_ORGANIZATION_SLUG;
      if (envOrgSlug) {
        orgSlug = envOrgSlug;
      } else {
        throw new Error(
          "Could not determine organization slug. Please set POLAR_ORGANIZATION_SLUG in environment variables.",
        );
      }
    }

    // Construct portal URL with organization slug and session token
    // Use /portal/overview to go directly to the overview page
    const portalUrl = `${POLAR_DASHBOARD_BASE_URL}/${orgSlug}/portal/overview?customer_session_token=${sessionData.token}`;
    logger.info(
      `Generated Polar customer portal link (constructed) for customer ${customerId}`,
      {
        orgSlug,
        portalUrl,
      },
    );

    return portalUrl;
  } catch (error: any) {
    logger.error("Error generating Polar customer portal link", {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Get Polar customer portal URL (legacy function - kept for backward compatibility)
 * For new implementations, use generatePolarCustomerPortalLink() instead
 * @deprecated Use generatePolarCustomerPortalLink() for authenticated portal links
 */
export function getPolarCustomerPortalUrl(_customerId?: string): string {
  // Return base URL - for authenticated links, use generatePolarCustomerPortalLink()
  return POLAR_DASHBOARD_BASE_URL;
}

/**
 * Check if Polar.sh payment setup is complete
 */
export async function checkPolarPaymentSetup() {
  try {
    const headers = getPolarHeaders();

    // Get organization info to check payment setup
    const response = await fetch(`${POLAR_API_BASE_URL}/organizations`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      logger.error("Failed to check Polar payment setup", error);
      return {
        isSetup: false,
        error: error.error || "Failed to check payment setup",
      };
    }

    const organizations = await response.json();

    // Check if any organization has payment methods configured
    // This is a simplified check - you may need to adjust based on Polar.sh API response
    return {
      isSetup: true,
      organizations: organizations.items || organizations,
    };
  } catch (error: any) {
    logger.error("Error checking Polar payment setup", error);
    return {
      isSetup: false,
      error: error.message || "Unknown error",
    };
  }
}

/**
 * Create a checkout session via Polar.sh API
 */
export async function createPolarCheckout(params: {
  products: string[];
  successUrl: string;
  customerEmail?: string;
  customerName?: string;
}) {
  try {
    const headers = getPolarHeaders();

    const body: any = {
      products: params.products,
      success_url: params.successUrl,
    };

    if (params.customerEmail) {
      body.customer_email = params.customerEmail;
    }

    if (params.customerName) {
      body.customer_name = params.customerName;
    }

    const response = await fetch(`${POLAR_API_BASE_URL}/checkouts`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      logger.error("Polar.sh checkout creation failed", errorData);
      throw new Error(
        errorData.error || `HTTP ${response.status}: Failed to create checkout`,
      );
    }

    const checkoutData = await response.json();
    return checkoutData;
  } catch (error: any) {
    logger.error("Error creating Polar checkout", error);
    throw error;
  }
}

/**
 * Get product details from Polar API
 * This helps verify which product ID corresponds to which plan
 */
export async function getPolarProduct(productId: string) {
  try {
    const headers = getPolarHeaders();

    const response = await fetch(
      `${POLAR_API_BASE_URL}/products/${productId}`,
      {
        method: "GET",
        headers,
      },
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      logger.error("Failed to fetch Polar product", errorData);
      throw new Error(
        errorData.error || `HTTP ${response.status}: Failed to fetch product`,
      );
    }

    const product = await response.json();
    return product;
  } catch (error: any) {
    logger.error("Error fetching Polar product", error);
    throw error;
  }
}

/**
 * Get subscription details from Polar API
 */
export async function getPolarSubscription(subscriptionId: string) {
  try {
    const headers = getPolarHeaders();

    const response = await fetch(
      `${POLAR_API_BASE_URL}/subscriptions/${subscriptionId}`,
      {
        method: "GET",
        headers,
      },
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      logger.error("Failed to fetch Polar subscription", errorData);
      throw new Error(
        errorData.error ||
          `HTTP ${response.status}: Failed to fetch subscription`,
      );
    }

    const subscription = await response.json();
    return subscription;
  } catch (error: any) {
    logger.error("Error fetching Polar subscription", error);
    throw error;
  }
}

/**
 * Get customer ID from subscription ID
 * This is useful when we have a subscription but not the customer ID
 */
export async function getCustomerIdFromSubscription(
  subscriptionId: string,
): Promise<string | null> {
  try {
    const subscription = await getPolarSubscription(subscriptionId);
    return subscription.customer_id || null;
  } catch (error: any) {
    logger.error("Error getting customer ID from subscription", error);
    return null;
  }
}

/**
 * Try to find customer ID by searching subscriptions by email
 * This is a fallback when customer ID is not in database
 */
export async function findCustomerIdByEmail(
  email: string,
): Promise<string | null> {
  try {
    const headers = getPolarHeaders();

    // List all subscriptions and search for matching email
    // Note: Polar API might not support direct email search, so we list recent subscriptions
    const response = await fetch(
      `${POLAR_API_BASE_URL}/subscriptions?limit=100`,
      {
        method: "GET",
        headers,
      },
    );

    if (!response.ok) {
      logger.warn("Failed to list subscriptions for email search", {
        status: response.status,
      });
      return null;
    }

    const data = await response.json();
    const subscriptions = data.items || data || [];

    // Search for subscription with matching customer email
    for (const subscription of subscriptions) {
      if (
        subscription.customer?.email === email ||
        subscription.customer_email === email
      ) {
        logger.info("Found customer ID by email", {
          email: subscription.customer_id,
        });
        return subscription.customer_id || null;
      }
    }

    logger.debug("No customer found with matching email", { email });
    return null;
  } catch (error: any) {
    logger.error("Error finding customer ID by email", error);
    return null;
  }
}

/**
 * Cancel a Polar subscription
 */
export async function cancelPolarSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true,
) {
  try {
    const headers = getPolarHeaders();

    const body: any = {
      cancel_at_period_end: cancelAtPeriodEnd,
    };

    const response = await fetch(
      `${POLAR_API_BASE_URL}/subscriptions/${subscriptionId}/cancel`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      logger.error("Failed to cancel Polar subscription", errorData);
      throw new Error(
        errorData.error ||
          `HTTP ${response.status}: Failed to cancel subscription`,
      );
    }

    const subscription = await response.json();
    return subscription;
  } catch (error: any) {
    logger.error("Error canceling Polar subscription", error);
    throw error;
  }
}

/**
 * Reactivate a canceled Polar subscription
 */
export async function reactivatePolarSubscription(subscriptionId: string) {
  try {
    const headers = getPolarHeaders();

    const response = await fetch(
      `${POLAR_API_BASE_URL}/subscriptions/${subscriptionId}/reactivate`,
      {
        method: "POST",
        headers,
      },
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      logger.error("Failed to reactivate Polar subscription", errorData);
      throw new Error(
        errorData.error ||
          `HTTP ${response.status}: Failed to reactivate subscription`,
      );
    }

    const subscription = await response.json();
    return subscription;
  } catch (error: any) {
    logger.error("Error reactivating Polar subscription", error);
    throw error;
  }
}

/**
 * Update Polar subscription (change product/plan)
 */
export async function updatePolarSubscription(
  subscriptionId: string,
  productId: string,
) {
  try {
    const headers = getPolarHeaders();

    const body: any = {
      product_id: productId,
    };

    const response = await fetch(
      `${POLAR_API_BASE_URL}/subscriptions/${subscriptionId}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      logger.error("Failed to update Polar subscription", errorData);
      throw new Error(
        errorData.error ||
          `HTTP ${response.status}: Failed to update subscription`,
      );
    }

    const subscription = await response.json();
    return subscription;
  } catch (error: any) {
    logger.error("Error updating Polar subscription", error);
    throw error;
  }
}
