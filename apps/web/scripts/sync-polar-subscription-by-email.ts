/**
 * Script to manually sync Polar subscription for a user by email
 * Usage: npx tsx scripts/sync-polar-subscription-by-email.ts <email>
 */

import { resolve } from "node:path";
// Load environment variables from .env.local before importing modules
import * as dotenv from "dotenv";

// Try multiple paths for .env.local (tsx might run from different directories)
const envPaths = [
  resolve(process.cwd(), "apps/web/.env.local"),
  resolve(process.cwd(), ".env.local"),
  resolve(process.cwd(), "apps/web/.env"),
  resolve(process.cwd(), ".env"),
];

for (const envPath of envPaths) {
  dotenv.config({ path: envPath });
}

import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Simple logger for script
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data ? JSON.stringify(data, null, 2) : "");
  },
  error: (message: string, error?: any) => {
    if (error) {
      if (error instanceof Error) {
        console.error(`[ERROR] ${message}:`, error.message);
        if (error.stack) {
          console.error("Stack:", error.stack);
        }
      } else if (typeof error === "object") {
        console.error(`[ERROR] ${message}:`, JSON.stringify(error, null, 2));
      } else {
        console.error(`[ERROR] ${message}:`, error);
      }
    } else {
      console.error(`[ERROR] ${message}`);
    }
  },
  warn: (message: string, data?: any) => {
    console.warn(
      `[WARN] ${message}`,
      data ? JSON.stringify(data, null, 2) : ""
    );
  },
};

const POLAR_API_BASE_URL =
  process.env.POLAR_USE_SANDBOX === "true"
    ? "https://sandbox-api.polar.sh/v1"
    : "https://api.polar.sh/v1";

async function getPolarHeaders() {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("POLAR_ACCESS_TOKEN is not configured");
  }
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

async function findCustomerByEmail(email: string): Promise<string | null> {
  try {
    const headers = await getPolarHeaders();

    // List customers and search for matching email
    const response = await fetch(`${POLAR_API_BASE_URL}/customers?limit=100`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      logger.error("Failed to list customers", { status: response.status });
      return null;
    }

    const data = await response.json();
    const customers = data.items || data || [];

    // Search for customer with matching email
    for (const customer of customers) {
      if (customer.email === email) {
        logger.info("Found customer by email", {
          customerId: customer.id,
          email: customer.email,
        });
        return customer.id;
      }
    }

    logger.warn("No customer found with matching email", { email });
    return null;
  } catch (error: any) {
    logger.error("Error finding customer by email", error);
    return null;
  }
}

async function findSubscriptionsByCustomerId(customerId: string) {
  try {
    const headers = await getPolarHeaders();

    const response = await fetch(
      `${POLAR_API_BASE_URL}/subscriptions?customer_id=${customerId}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      logger.error("Failed to fetch subscriptions", {
        status: response.status,
      });
      return [];
    }

    const data = await response.json();
    return data.items || data || [];
  } catch (error: any) {
    logger.error("Error fetching subscriptions", error);
    return [];
  }
}

async function syncSubscription(userId: string, subscriptionId: string) {
  try {
    const headers = await getPolarHeaders();

    logger.info(
      `Fetching subscription details from Polar API: ${subscriptionId}`
    );
    const response = await fetch(
      `${POLAR_API_BASE_URL}/subscriptions/${subscriptionId}`,
      {
        headers,
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      logger.error(`Failed to fetch subscription`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(
        `Failed to fetch subscription: ${response.status} ${response.statusText}`
      );
    }

    const subscription = await response.json();
    logger.info(`Received subscription data:`, {
      productId: subscription.product_id,
      customerId: subscription.customer_id,
      status: subscription.status,
    });

    const productId = subscription.product_id;
    const customerId = subscription.customer_id;
    const status = subscription.status;

    // Convert timestamps to ISO strings, handling null/undefined/invalid values
    let currentPeriodEnd: string | null = null;
    if (subscription.current_period_end) {
      const timestamp = subscription.current_period_end * 1000;
      const date = new Date(timestamp);
      if (!Number.isNaN(date.getTime())) {
        currentPeriodEnd = date.toISOString();
      }
    }

    let currentPeriodStart: string | null = null;
    if (subscription.current_period_start) {
      const timestamp = subscription.current_period_start * 1000;
      const date = new Date(timestamp);
      if (!Number.isNaN(date.getTime())) {
        currentPeriodStart = date.toISOString();
      }
    }

    logger.info(`Date conversion:`, {
      current_period_end_raw: subscription.current_period_end,
      current_period_end_converted: currentPeriodEnd,
      current_period_start_raw: subscription.current_period_start,
      current_period_start_converted: currentPeriodStart,
    });

    // Update user table
    logger.info(`Updating user table for user: ${userId}`);
    const { error: userError } = await supabaseAdmin
      .from("users")
      .update({
        polar_customer_id: customerId,
        polar_subscription_id: subscriptionId,
        polar_product_id: productId,
        polar_current_period_end: currentPeriodEnd,
        payment_provider: "polar",
      })
      .eq("id", userId);

    if (userError) {
      logger.error(`Failed to update user table`, userError);
      throw new Error(`Failed to update user: ${userError.message}`);
    }
    logger.info(`Successfully updated user table`);

    // Update or create subscription record
    logger.info(`Checking for existing subscription record`);
    const { data: existingSub, error: checkError } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("polar_subscription_id", subscriptionId)
      .maybeSingle();

    if (checkError) {
      logger.error(`Error checking for existing subscription:`, checkError);
      throw new Error(
        `Failed to check for existing subscription: ${checkError.message}`
      );
    }

    const subscriptionData: any = {
      user_id: userId,
      polar_subscription_id: subscriptionId,
      polar_customer_id: customerId,
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
      logger.info(`Updating existing subscription record: ${existingSub.id}`);
      const { error: subError } = await supabaseAdmin
        .from("subscriptions")
        .update(subscriptionData)
        .eq("id", existingSub.id);

      if (subError) {
        logger.error(`Failed to update subscription record`, subError);
        throw new Error(`Failed to update subscription: ${subError.message}`);
      }
      logger.info(`Successfully updated subscription record`);
    } else {
      logger.info(`Creating new subscription record`);
      const { error: subError } = await supabaseAdmin
        .from("subscriptions")
        .insert(subscriptionData);

      if (subError) {
        logger.error(`Failed to create subscription record`, subError);
        throw new Error(`Failed to create subscription: ${subError.message}`);
      }
      logger.info(`Successfully created subscription record`);
    }

    logger.info(
      `Successfully synced subscription ${subscriptionId} for user ${userId}`,
      {
        productId,
        customerId,
        status,
      }
    );

    return { success: true };
  } catch (error: any) {
    logger.error("Error syncing subscription", error);
    throw error;
  }
}

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error(
      "Usage: npx tsx scripts/sync-polar-subscription-by-email.ts <email>"
    );
    process.exit(1);
  }

  logger.info(`Starting sync for email: ${email}`);

  // Find user in database
  const { data: userData, error: userError } = await supabaseAdmin
    .from("users")
    .select("id, email")
    .eq("email", email)
    .single();

  if (userError || !userData) {
    logger.error(`User not found for email: ${email}`, userError);
    process.exit(1);
  }

  logger.info(`Found user: ${userData.id}`);

  // Find customer in Polar by email
  const customerId = await findCustomerByEmail(email);

  if (!customerId) {
    logger.error(`No Polar customer found for email: ${email}`);
    process.exit(1);
  }

  logger.info(`Found Polar customer: ${customerId}`);

  // Find subscriptions for this customer
  const subscriptions = await findSubscriptionsByCustomerId(customerId);

  if (subscriptions.length === 0) {
    logger.warn(`No subscriptions found for customer: ${customerId}`);
    process.exit(1);
  }

  // Sync all active subscriptions
  for (const subscription of subscriptions) {
    if (subscription.status === "active") {
      logger.info(`Syncing subscription: ${subscription.id}`);
      await syncSubscription(userData.id, subscription.id);
    }
  }

  logger.info("Sync completed successfully!");
}

main().catch((error) => {
  logger.error("Script failed", error);
  process.exit(1);
});
