#!/usr/bin/env tsx
/**
 * Fix Subscription Plans Script
 * 
 * This script:
 * 1. Fetches subscriptions from Polar API
 * 2. Identifies product IDs and their plan names
 * 3. Updates user records with correct product IDs
 * 4. Shows which environment variables need to be set
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;
const isSandbox = process.env.POLAR_USE_SANDBOX === "true";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables!");
  process.exit(1);
}

if (!polarAccessToken) {
  console.error("❌ Missing POLAR_ACCESS_TOKEN!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const POLAR_API_BASE_URL = isSandbox
  ? "https://sandbox-api.polar.sh/v1"
  : "https://api.polar.sh/v1";

async function getPolarHeaders() {
  return {
    Authorization: `Bearer ${polarAccessToken}`,
    "Content-Type": "application/json",
  };
}

async function getPolarProduct(productId: string) {
  const headers = await getPolarHeaders();
  const response = await fetch(`${POLAR_API_BASE_URL}/products/${productId}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch product: ${response.status}`);
  }

  return await response.json();
}

async function getPolarSubscription(subscriptionId: string) {
  const headers = await getPolarHeaders();
  const response = await fetch(
    `${POLAR_API_BASE_URL}/subscriptions/${subscriptionId}`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch subscription: ${response.status}`);
  }

  return await response.json();
}

async function identifyPlanFromProduct(product: any): Promise<string> {
  const name = product.name?.toLowerCase() || "";
  const description = product.description?.toLowerCase() || "";

  if (name.includes("enterprise") || description.includes("enterprise")) {
    // Check if monthly or yearly based on price
    const prices = product.prices || [];
    const monthlyPrice = prices.find((p: any) => p.billing_period === "month");
    const yearlyPrice = prices.find((p: any) => p.billing_period === "year");

    if (monthlyPrice) return "Enterprise Monthly";
    if (yearlyPrice) return "Enterprise Yearly";
    return "Enterprise";
  }

  if (name.includes("pro") || description.includes("pro")) {
    const prices = product.prices || [];
    const monthlyPrice = prices.find((p: any) => p.billing_period === "month");
    const yearlyPrice = prices.find((p: any) => p.billing_period === "year");

    if (monthlyPrice) return "Pro Monthly";
    if (yearlyPrice) return "Pro Yearly";
    return "Pro";
  }

  return "Unknown";
}

async function fixSubscriptionPlans() {
  console.log("🔍 Analyzing subscriptions and fixing plan assignments...\n");

  // Get all users with Polar subscriptions
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select(
      "id, email, name, polar_product_id, polar_subscription_id, polar_customer_id"
    )
    .not("polar_subscription_id", "is", null)
    .order("created_at", { ascending: false });

  if (usersError) {
    console.error("❌ Error fetching users:", usersError);
    process.exit(1);
  }

  if (!users || users.length === 0) {
    console.log("✅ No users with Polar subscriptions found.");
    return;
  }

  console.log(`📊 Found ${users.length} user(s) with Polar subscriptions\n`);

  // Map to store product IDs and their plan types
  const productIdMap = new Map<string, { plan: string; product: any }>();

  // Process each user
  for (const user of users) {
    if (!user.polar_subscription_id) continue;

    try {
      console.log(`\n👤 Processing user: ${user.email || user.name || user.id}`);
      console.log(`   Subscription ID: ${user.polar_subscription_id}`);

      // Fetch subscription from Polar API
      const subscription = await getPolarSubscription(user.polar_subscription_id);
      const productId = subscription.product_id;

      console.log(`   Product ID: ${productId}`);

      // If we haven't seen this product ID before, fetch its details
      if (!productIdMap.has(productId)) {
        const product = await getPolarProduct(productId);
        const planName = await identifyPlanFromProduct(product);

        productIdMap.set(productId, {
          plan: planName,
          product,
        });

        console.log(`   ✅ Identified as: ${planName}`);
        console.log(`   Product Name: ${product.name || "N/A"}`);
      } else {
        const { plan } = productIdMap.get(productId)!;
        console.log(`   ✅ Already identified as: ${plan}`);
      }

      // Check if user's product_id needs updating
      if (user.polar_product_id !== productId) {
        console.log(
          `   ⚠️  Product ID mismatch! Updating from "${user.polar_product_id}" to "${productId}"`
        );

        const { error: updateError } = await supabase
          .from("users")
          .update({ polar_product_id: productId })
          .eq("id", user.id);

        if (updateError) {
          console.error(`   ❌ Failed to update: ${updateError.message}`);
        } else {
          console.log(`   ✅ Updated successfully`);
        }
      } else {
        console.log(`   ✅ Product ID is correct`);
      }
    } catch (error: any) {
      console.error(`   ❌ Error processing user: ${error.message}`);
    }
  }

  // Display summary and environment variables needed
  console.log("\n" + "=".repeat(80));
  console.log("📋 SUMMARY & ENVIRONMENT VARIABLES NEEDED");
  console.log("=".repeat(80));
  console.log("\n");

  const enterpriseMonthly = Array.from(productIdMap.entries()).find(
    ([_, { plan }]) => plan === "Enterprise Monthly"
  );
  const enterpriseYearly = Array.from(productIdMap.entries()).find(
    ([_, { plan }]) => plan === "Enterprise Yearly"
  );
  const proMonthly = Array.from(productIdMap.entries()).find(
    ([_, { plan }]) => plan === "Pro Monthly"
  );
  const proYearly = Array.from(productIdMap.entries()).find(
    ([_, { plan }]) => plan === "Pro Yearly"
  );

  console.log("🔧 Set these environment variables in Vercel:\n");

  if (enterpriseMonthly) {
    console.log(
      `NEXT_PUBLIC_POLAR_ENTERPRISE_MONTHLY_PLAN_ID=${enterpriseMonthly[0]}`
    );
  } else {
    console.log("NEXT_PUBLIC_POLAR_ENTERPRISE_MONTHLY_PLAN_ID=<not found>");
  }

  if (enterpriseYearly) {
    console.log(
      `NEXT_PUBLIC_POLAR_ENTERPRISE_YEARLY_PLAN_ID=${enterpriseYearly[0]}`
    );
  } else {
    console.log("NEXT_PUBLIC_POLAR_ENTERPRISE_YEARLY_PLAN_ID=<not found>");
  }

  if (proMonthly) {
    console.log(`NEXT_PUBLIC_POLAR_PRO_MONTHLY_PLAN_ID=${proMonthly[0]}`);
  } else {
    console.log("NEXT_PUBLIC_POLAR_PRO_MONTHLY_PLAN_ID=<not found>");
  }

  if (proYearly) {
    console.log(`NEXT_PUBLIC_POLAR_PRO_YEARLY_PLAN_ID=${proYearly[0]}`);
  } else {
    console.log("NEXT_PUBLIC_POLAR_PRO_YEARLY_PLAN_ID=<not found>");
  }

  console.log("\n" + "=".repeat(80));
  console.log("📊 PRODUCT ID MAPPING");
  console.log("=".repeat(80));
  console.log("\n");

  for (const [productId, { plan, product }] of productIdMap.entries()) {
    console.log(`${plan.padEnd(25)} | ${productId}`);
    console.log(`   Product: ${product.name || "N/A"}`);
    console.log("");
  }

  console.log("\n✅ Fix complete!");
  console.log(
    "\n💡 Next steps:"
  );
  console.log("1. Copy the environment variables above and set them in Vercel");
  console.log("2. Redeploy your application");
  console.log("3. Users should now see the correct plan!");
}

fixSubscriptionPlans()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
