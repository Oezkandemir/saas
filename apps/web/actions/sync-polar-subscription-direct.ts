"use server";

import { auth } from "@/auth";

import { pricingData } from "@/config/subscriptions";
import { env } from "@/env.mjs";
import { supabaseAdmin } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Helper function to get plan name from product ID
 */
function getPlanNameFromProductId(productId: string | null | undefined): string {
  if (!productId) return "Free";
  
  for (const plan of pricingData) {
    if (plan.polarIds?.monthly === productId || plan.polarIds?.yearly === productId) {
      return plan.title;
    }
  }
  
  return `Unknown Plan (${productId})`;
}

/**
 * Helper function to get user display info for logging
 */
async function getUserDisplayInfo(userId: string): Promise<{ name: string; email: string } | null> {
  try {
    // Get user data from users table (has email and name)
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("email, name")
      .eq("id", userId)
      .single();
    
    if (!userData) {
      return null;
    }
    
    // Try to get display_name from user_profiles for better name
    const { data: profileData } = await supabaseAdmin
      .from("user_profiles")
      .select("display_name")
      .eq("user_id", userId)
      .single();
    
    // Prioritize display_name from profile, then name from users, then email prefix
    const displayName = profileData?.display_name || 
                       userData.name || 
                       userData.email?.split("@")[0] || 
                       "Unknown";
    
    return {
      name: displayName,
      email: userData.email || "Unknown",
    };
  } catch {
    return null;
  }
}

/**
 * Sync subscription directly from Polar API
 * This ensures we always have the latest subscription data
 */
export async function syncPolarSubscriptionDirect(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Get authenticated user
    const session = await auth();
    const user = session?.user;

    if (!user || !user.id) {
      return { success: false, message: "User not authenticated" };
    }

    // Get user's Polar subscription ID, customer ID, and email
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("polar_subscription_id, polar_customer_id, email")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      logger.error("Error fetching user data:", userError);
      return { success: false, message: "Error fetching user data" };
    }

    // Get user email from session if not in database
    const userEmail = userData.email || user.email;

    // Fetch subscription details from Polar API
    const isSandbox =
      env.POLAR_USE_SANDBOX === "true" ||
      process.env.POLAR_USE_SANDBOX === "true";
    const apiUrl = isSandbox
      ? "https://sandbox-api.polar.sh/v1"
      : "https://api.polar.sh/v1";
    const accessToken =
      env.POLAR_ACCESS_TOKEN || process.env.POLAR_ACCESS_TOKEN;

    let customerId = userData.polar_customer_id;
    let subscriptionId = userData.polar_subscription_id;

    // If no customer ID, try to find customer by email
    if (!customerId && userEmail) {
      logger.info(
        `No customer ID found, searching for customer by email: ${userEmail}`,
      );
      
      try {
        // List customers and search for matching email
        const customersResponse = await fetch(
          `${apiUrl}/customers?limit=100`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            cache: "no-store",
          },
        );

        if (customersResponse.ok) {
          const customersData = await customersResponse.json();
          const customers = customersData.items || customersData || [];
          
          // Search for customer with matching email
          const foundCustomer = customers.find(
            (customer: any) => customer.email === userEmail,
          );
          
          if (foundCustomer) {
            customerId = foundCustomer.id;
            logger.info(`Found customer by email: ${customerId}`);
          } else {
            logger.warn(`No customer found with email: ${userEmail}`);
          }
        }
      } catch (error) {
        logger.error("Error searching for customer by email:", error);
      }
    }

    // If still no customer ID, try to find subscription directly by email
    if (!customerId && userEmail) {
      logger.info(
        `No customer ID found, trying to find subscription directly by email: ${userEmail}`,
      );
      
      try {
        // List all subscriptions and search for matching email
        const subscriptionsResponse = await fetch(
          `${apiUrl}/subscriptions?limit=100`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            cache: "no-store",
          },
        );

        if (subscriptionsResponse.ok) {
          const subscriptionsData = await subscriptionsResponse.json();
          const allSubscriptions = subscriptionsData.items || subscriptionsData || [];
          
          // Search for subscription with matching customer email
          const matchingSubscription = allSubscriptions.find(
            (sub: any) =>
              (sub.customer?.email === userEmail ||
                sub.customer_email === userEmail) &&
              sub.status === "active",
          );
          
          if (matchingSubscription) {
            customerId = matchingSubscription.customer_id;
            subscriptionId = matchingSubscription.id;
            logger.info(`Found subscription by email: ${subscriptionId}`, {
              customerId,
              productId: matchingSubscription.product_id,
            });
          } else {
            logger.warn(`No active subscription found with email: ${userEmail}`);
          }
        }
      } catch (error) {
        logger.error("Error searching for subscription by email:", error);
      }
    }

    // If still no customer ID, nothing to sync
    if (!customerId) {
      return {
        success: true,
        message: "No Polar customer ID found",
      };
    }

    // If no subscription ID, try to find active subscription by customer ID
    if (!subscriptionId) {
      logger.info(
        `No subscription ID found, searching for active subscription for customer ${customerId}`,
      );
      
      try {
        // Try multiple endpoints to find subscriptions
        // Method 1: Use subscriptions endpoint with customer_id filter
        const subscriptionsResponse = await fetch(
          `${apiUrl}/subscriptions?customer_id=${customerId}&limit=100`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            cache: "no-store",
          },
        );

        let subscriptions: any[] = [];

        if (subscriptionsResponse.ok) {
          const subscriptionsData = await subscriptionsResponse.json();
          subscriptions = subscriptionsData.items || subscriptionsData || [];
          logger.info(`Found ${subscriptions.length} subscriptions via /subscriptions endpoint`);
        } else {
          // Method 2: Fallback to customer subscriptions endpoint
          logger.info("Trying alternative endpoint: /customers/{id}/subscriptions");
          const customerResponse = await fetch(
            `${apiUrl}/customers/${customerId}/subscriptions`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              cache: "no-store",
            },
          );

          if (customerResponse.ok) {
            const customerSubsData = await customerResponse.json();
            subscriptions = customerSubsData.items || customerSubsData || [];
            logger.info(`Found ${subscriptions.length} subscriptions via /customers/{id}/subscriptions endpoint`);
          } else {
            logger.warn("Both subscription endpoints failed", {
              subscriptionsStatus: subscriptionsResponse.status,
              customerStatus: customerResponse.status,
            });
          }
        }

        // Find active subscription (prioritize active, then any subscription)
        const activeSubscription = subscriptions.find(
          (sub: any) => sub.status === "active",
        ) || subscriptions[0]; // Fallback to first subscription if no active found
        
        if (activeSubscription) {
          subscriptionId = activeSubscription.id;
          logger.info(`Found subscription: ${subscriptionId}`, {
            status: activeSubscription.status,
            productId: activeSubscription.product_id,
          });
        } else {
          logger.warn("No subscriptions found for customer", {
            customerId,
            subscriptionsCount: subscriptions.length,
          });
          return {
            success: true,
            message: "No active subscription found",
          };
        }
      } catch (error) {
        logger.error("Error fetching customer subscriptions:", error);
        return {
          success: false,
          message: "Failed to fetch customer subscriptions",
        };
      }
    }

    // If still no subscription ID, nothing to sync
    if (!subscriptionId) {
      return {
        success: true,
        message: "No active subscription to sync",
      };
    }

    logger.info(
      `Syncing subscription ${subscriptionId} directly from Polar API`,
    );

    const response = await fetch(
      `${apiUrl}/subscriptions/${subscriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        // Don't cache this request
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error("Failed to fetch Polar subscription", {
        status: response.status,
        error: errorData,
      });
      return {
        success: false,
        message: `Failed to fetch subscription: ${response.statusText}`,
      };
    }

    const subscription = await response.json();

    // Extract subscription data
    const productId = subscription.product_id;
    const subscriptionCustomerId = subscription.customer_id;
    const status = subscription.status; // active, canceled, etc.
    
    // Convert timestamps to ISO strings, handling null/undefined/invalid values safely
    let currentPeriodEnd: string | null = null;
    if (subscription.current_period_end) {
      try {
        const timestamp = subscription.current_period_end * 1000;
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          currentPeriodEnd = date.toISOString();
        } else {
          logger.warn("Invalid current_period_end timestamp", {
            value: subscription.current_period_end,
          });
        }
      } catch (error) {
        logger.error("Error converting current_period_end", error);
      }
    }
    
    let currentPeriodStart: string | null = null;
    if (subscription.current_period_start) {
      try {
        const timestamp = subscription.current_period_start * 1000;
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          currentPeriodStart = date.toISOString();
        } else {
          logger.warn("Invalid current_period_start timestamp", {
            value: subscription.current_period_start,
          });
        }
      } catch (error) {
        logger.error("Error converting current_period_start", error);
      }
    }

    // Use the customerId from subscription or the one we found earlier
    const finalCustomerId = subscriptionCustomerId || customerId;

    const planName = getPlanNameFromProductId(productId);
    const userInfo = await getUserDisplayInfo(user.id);
    logger.info(
      `Updating user "${userInfo?.name || "Unknown"}" (${userInfo?.email || "Unknown"}) with latest Polar subscription data: Plan: ${planName}, Status: ${status}`,
    );

    // Update user table with latest data
    
    const { error: userUpdateError } = await supabaseAdmin
      .from("users")
      .update({
        polar_customer_id: finalCustomerId,
        polar_subscription_id: subscriptionId,
        polar_product_id: productId,
        polar_current_period_end: currentPeriodEnd,
        payment_provider: "polar",
      })
      .eq("id", user.id);

    if (userUpdateError) {
      logger.error("Error updating user Polar data", userUpdateError);
      return {
        success: false,
        message: `Failed to update user: ${userUpdateError.message}`,
      };
    }

    // Update or create subscription record
    const { data: existingSub } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("polar_subscription_id", subscriptionId)
      .maybeSingle();

    const subscriptionData: any = {
      user_id: user.id,
      polar_subscription_id: subscriptionId,
      polar_customer_id: finalCustomerId,
      polar_product_id: productId,
      status:
        status === "active"
          ? "active"
          : status === "canceled"
            ? "canceled"
            : "past_due",
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      payment_provider: "polar",
      updated_at: new Date().toISOString(),
    };

    if (existingSub) {
      await supabaseAdmin
        .from("subscriptions")
        .update(subscriptionData)
        .eq("id", existingSub.id);
    } else {
      await supabaseAdmin.from("subscriptions").insert(subscriptionData);
    }

    // Note: Cache invalidation is handled by unstable_noStore() in the page component
    // We don't call revalidateTag here to avoid calling it during render

    // Reuse planName and userInfo from above (already declared at line 362-363)
    logger.info(
      `Successfully synced subscription from Polar API: User "${userInfo?.name || "Unknown"}" (${userInfo?.email || "Unknown"}) → Plan: ${planName}, Status: ${status}`,
    );

    return {
      success: true,
      message: "Subscription synced successfully from Polar API",
    };
  } catch (error: any) {
    logger.error("Error syncing Polar subscription directly", error);
    return {
      success: false,
      message: error.message || "Failed to sync subscription",
    };
  }
}

