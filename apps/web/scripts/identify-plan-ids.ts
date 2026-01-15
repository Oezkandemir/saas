#!/usr/bin/env tsx
/**
 * Identify Plan IDs Script
 * 
 * This script fetches product information from Polar API for existing subscriptions
 * and identifies which Product IDs correspond to which plans (Pro/Enterprise, Monthly/Yearly)
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
    const errorText = await response.text();
    throw new Error(`Failed to fetch product ${productId}: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

function identifyPlanType(product: any): {
  plan: "Pro" | "Enterprise" | "Free" | "Unknown";
  interval: "month" | "year" | "unknown";
} {
  const name = (product.name || "").toLowerCase();
  const description = (product.description || "").toLowerCase();

  // Check for Enterprise
  const isEnterprise =
    name.includes("enterprise") ||
    description.includes("enterprise") ||
    name.includes("20") ||
    description.includes("20€") ||
    description.includes("20 euro");

  // Check for Pro
  const isPro =
    name.includes("pro") ||
    description.includes("pro") ||
    (name.includes("10") && !isEnterprise) ||
    (description.includes("10€") && !isEnterprise) ||
    (description.includes("10 euro") && !isEnterprise);

  // Determine interval from prices
  const prices = product.prices || [];
  const monthlyPrice = prices.find(
    (p: any) => p.billing_period === "month" || p.billing_period === "monthly"
  );
  const yearlyPrice = prices.find(
    (p: any) => p.billing_period === "year" || p.billing_period === "yearly"
  );

  let interval: "month" | "year" | "unknown" = "unknown";
  if (monthlyPrice) interval = "month";
  if (yearlyPrice) interval = "year";

  let plan: "Pro" | "Enterprise" | "Free" | "Unknown" = "Unknown";
  if (isEnterprise) plan = "Enterprise";
  else if (isPro) plan = "Pro";
  else if (name.includes("free") || description.includes("free")) plan = "Free";

  return { plan, interval };
}

async function identifyPlanIds() {
  console.log("🔍 Identifying Plan IDs from existing subscriptions...\n");
  console.log(`Using ${isSandbox ? "SANDBOX" : "PRODUCTION"} Polar API\n`);

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

  // Map to store unique product IDs and their details
  const productMap = new Map<
    string,
    {
      plan: "Pro" | "Enterprise" | "Free" | "Unknown";
      interval: "month" | "year" | "unknown";
      product: any;
      users: string[];
    }
  >();

  // Process each user's subscription
  for (const user of users) {
    if (!user.polar_subscription_id || !user.polar_product_id) continue;

    try {
      console.log(`\n👤 User: ${user.email || user.name || user.id}`);
      console.log(`   Product ID: ${user.polar_product_id}`);

      // If we haven't seen this product ID, fetch its details
      if (!productMap.has(user.polar_product_id)) {
        const product = await getPolarProduct(user.polar_product_id);
        const { plan, interval } = identifyPlanType(product);

        productMap.set(user.polar_product_id, {
          plan,
          interval,
          product,
          users: [user.email || user.name || user.id],
        });

        console.log(`   ✅ Identified: ${plan} (${interval})`);
        console.log(`   Product Name: ${product.name || "N/A"}`);
        console.log(`   Description: ${product.description || "N/A"}`);
        if (product.prices && product.prices.length > 0) {
          console.log(
            `   Prices: ${product.prices.map((p: any) => `${p.price_amount / 100}${p.price_currency} (${p.billing_period})`).join(", ")}`
          );
        }
      } else {
        const existing = productMap.get(user.polar_product_id)!;
        existing.users.push(user.email || user.name || user.id);
        console.log(
          `   ✅ Already identified: ${existing.plan} (${existing.interval})`
        );
      }
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }

  // Display results
  console.log("\n" + "=".repeat(80));
  console.log("📋 IDENTIFIED PLAN PRODUCT IDs");
  console.log("=".repeat(80));
  console.log("\n");

  const proMonthly = Array.from(productMap.entries()).find(
    ([_, { plan, interval }]) => plan === "Pro" && interval === "month"
  );
  const proYearly = Array.from(productMap.entries()).find(
    ([_, { plan, interval }]) => plan === "Pro" && interval === "year"
  );
  const enterpriseMonthly = Array.from(productMap.entries()).find(
    ([_, { plan, interval }]) => plan === "Enterprise" && interval === "month"
  );
  const enterpriseYearly = Array.from(productMap.entries()).find(
    ([_, { plan, interval }]) => plan === "Enterprise" && interval === "year"
  );

  console.log("🔧 ENVIRONMENT VARIABLES FOR VERCEL:\n");
  console.log("Copy and paste these into your Vercel project settings:\n");

  if (proMonthly) {
    console.log(
      `NEXT_PUBLIC_POLAR_PRO_MONTHLY_PLAN_ID=${proMonthly[0]}`
    );
    console.log(`  # Product: ${proMonthly[1].product.name || "N/A"}`);
    console.log(`  # Users: ${proMonthly[1].users.join(", ")}\n`);
  } else {
    console.log("NEXT_PUBLIC_POLAR_PRO_MONTHLY_PLAN_ID=<not found>\n");
  }

  if (proYearly) {
    console.log(`NEXT_PUBLIC_POLAR_PRO_YEARLY_PLAN_ID=${proYearly[0]}`);
    console.log(`  # Product: ${proYearly[1].product.name || "N/A"}`);
    console.log(`  # Users: ${proYearly[1].users.join(", ")}\n`);
  } else {
    console.log("NEXT_PUBLIC_POLAR_PRO_YEARLY_PLAN_ID=<not found>\n");
  }

  if (enterpriseMonthly) {
    console.log(
      `NEXT_PUBLIC_POLAR_ENTERPRISE_MONTHLY_PLAN_ID=${enterpriseMonthly[0]}`
    );
    console.log(
      `  # Product: ${enterpriseMonthly[1].product.name || "N/A"}`
    );
    console.log(
      `  # Users: ${enterpriseMonthly[1].users.join(", ")}\n`
    );
  } else {
    console.log(
      "NEXT_PUBLIC_POLAR_ENTERPRISE_MONTHLY_PLAN_ID=<not found>\n"
    );
  }

  if (enterpriseYearly) {
    console.log(
      `NEXT_PUBLIC_POLAR_ENTERPRISE_YEARLY_PLAN_ID=${enterpriseYearly[0]}`
    );
    console.log(
      `  # Product: ${enterpriseYearly[1].product.name || "N/A"}`
    );
    console.log(`  # Users: ${enterpriseYearly[1].users.join(", ")}\n`);
  } else {
    console.log(
      "NEXT_PUBLIC_POLAR_ENTERPRISE_YEARLY_PLAN_ID=<not found>\n"
    );
  }

  console.log("=".repeat(80));
  console.log("📊 ALL PRODUCT IDs FOUND");
  console.log("=".repeat(80));
  console.log("\n");

  for (const [productId, { plan, interval, product, users }] of productMap.entries()) {
    console.log(`${plan} (${interval})`.padEnd(25) + ` | ${productId}`);
    console.log(`  Product: ${product.name || "N/A"}`);
    console.log(`  Users: ${users.join(", ")}`);
    console.log("");
  }

  console.log("\n✅ Identification complete!");
  console.log(
    "\n💡 Next steps:"
  );
  console.log("1. Copy the environment variables above");
  console.log("2. Go to Vercel Dashboard → Your Project → Settings → Environment Variables");
  console.log("3. Add each variable for Production, Preview, and Development");
  console.log("4. Redeploy your application");
  console.log("5. Users should now see the correct plan!");
}

identifyPlanIds()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
