#!/usr/bin/env tsx

/**
 * Diagnose and Fix Plan Sync Issues
 * 
 * This script:
 * 1. Checks current user's polar_product_id in database
 * 2. Fetches latest subscription from Polar API
 * 3. Compares with configured plan IDs
 * 4. Updates database if needed
 * 5. Shows what environment variables need to be set
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get Polar API configuration
const isSandbox =
  process.env.POLAR_USE_SANDBOX === "true" ||
  process.env.POLAR_USE_SANDBOX === "1";
const apiUrl = isSandbox
  ? "https://sandbox-api.polar.sh/v1"
  : "https://api.polar.sh/v1";
const accessToken =
  process.env.POLAR_ACCESS_TOKEN || process.env.POLAR_ACCESS_TOKEN;

if (!accessToken) {
  console.error("❌ Missing POLAR_ACCESS_TOKEN!");
  process.exit(1);
}

// Configured plan IDs from environment
const configuredPlans = {
  pro: {
    monthly: process.env.NEXT_PUBLIC_POLAR_PRO_MONTHLY_PLAN_ID?.trim(),
    yearly: process.env.NEXT_PUBLIC_POLAR_PRO_YEARLY_PLAN_ID?.trim(),
  },
  enterprise: {
    monthly: process.env.NEXT_PUBLIC_POLAR_ENTERPRISE_MONTHLY_PLAN_ID?.trim(),
    yearly: process.env.NEXT_PUBLIC_POLAR_ENTERPRISE_YEARLY_PLAN_ID?.trim(),
  },
};

async function getPolarSubscription(subscriptionId: string) {
  const response = await fetch(`${apiUrl}/subscriptions/${subscriptionId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch subscription: ${response.statusText}`);
  }

  return response.json();
}

async function getPolarProduct(productId: string) {
  const response = await fetch(`${apiUrl}/products/${productId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch product: ${productId}`);
  }

  return response.json();
}

async function diagnoseAndFix() {
  console.log("🔍 Diagnosing Plan Sync Issues...\n");
  console.log(`Using ${isSandbox ? "SANDBOX" : "PRODUCTION"} Polar API\n`);

  // Get all users with Polar subscriptions
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select(
      "id, email, name, polar_product_id, polar_subscription_id, polar_customer_id, updated_at"
    )
    .not("polar_subscription_id", "is", null)
    .order("updated_at", { ascending: false });

  if (usersError) {
    console.error("❌ Error fetching users:", usersError);
    process.exit(1);
  }

  if (!users || users.length === 0) {
    console.log("✅ No users with Polar subscriptions found.");
    return;
  }

  console.log(`📊 Found ${users.length} user(s) with Polar subscriptions\n`);

  // Check configured environment variables
  console.log("=".repeat(80));
  console.log("📋 CONFIGURED ENVIRONMENT VARIABLES");
  console.log("=".repeat(80));
  console.log("\n");

  const envStatus = {
    proMonthly: {
      set: !!configuredPlans.pro.monthly,
      value: configuredPlans.pro.monthly || "NOT SET",
    },
    proYearly: {
      set: !!configuredPlans.pro.yearly,
      value: configuredPlans.pro.yearly || "NOT SET",
    },
    enterpriseMonthly: {
      set: !!configuredPlans.enterprise.monthly,
      value: configuredPlans.enterprise.monthly || "NOT SET",
    },
    enterpriseYearly: {
      set: !!configuredPlans.enterprise.yearly,
      value: configuredPlans.enterprise.yearly || "NOT SET",
    },
  };

  console.log("Pro Monthly:");
  console.log(
    `  Status: ${envStatus.proMonthly.set ? "✅ Set" : "⚠️  Not Set"}`
  );
  console.log(`  Value: ${envStatus.proMonthly.value}\n`);

  console.log("Pro Yearly:");
  console.log(
    `  Status: ${envStatus.proYearly.set ? "✅ Set" : "⚠️  Not Set"}`
  );
  console.log(`  Value: ${envStatus.proYearly.value}\n`);

  console.log("Enterprise Monthly:");
  console.log(
    `  Status: ${envStatus.enterpriseMonthly.set ? "✅ Set" : "⚠️  Not Set"}`
  );
  console.log(`  Value: ${envStatus.enterpriseMonthly.value}\n`);

  console.log("Enterprise Yearly:");
  console.log(
    `  Status: ${envStatus.enterpriseYearly.set ? "✅ Set" : "⚠️  Not Set"}`
  );
  console.log(`  Value: ${envStatus.enterpriseYearly.value}\n`);

  // Process each user
  console.log("=".repeat(80));
  console.log("👥 USER DIAGNOSIS & FIXES");
  console.log("=".repeat(80));
  console.log("\n");

  const productIdMap = new Map<
    string,
    {
      plan: string;
      interval: string;
      product: any;
      users: string[];
    }
  >();

  for (const user of users) {
    if (!user.polar_subscription_id) continue;

    try {
      console.log(`\n👤 User: ${user.email || user.name || user.id}`);
      console.log(`   Database Product ID: ${user.polar_product_id || "NULL"}`);
      console.log(`   Subscription ID: ${user.polar_subscription_id}`);

      // Fetch latest subscription from Polar API
      const subscription = await getPolarSubscription(user.polar_subscription_id);
      const apiProductId = subscription.product_id;
      const status = subscription.status;

      console.log(`   Polar API Product ID: ${apiProductId}`);
      console.log(`   Status: ${status}`);

      // Fetch product details
      const product = await getPolarProduct(apiProductId);
      const productName = product.name || "Unknown";
      const productPrice = product.prices?.[0]?.price_amount
        ? `${product.prices[0].price_amount / 100} ${product.prices[0].price_currency}`
        : "Unknown";

      console.log(`   Product Name: ${productName}`);
      console.log(`   Product Price: ${productPrice}`);

      // Determine plan and interval from product
      let plan = "Unknown";
      let interval = "unknown";

      // Check if product ID matches configured plans
      if (apiProductId === configuredPlans.pro.monthly) {
        plan = "Pro";
        interval = "month";
      } else if (apiProductId === configuredPlans.pro.yearly) {
        plan = "Pro";
        interval = "year";
      } else if (apiProductId === configuredPlans.enterprise.monthly) {
        plan = "Enterprise";
        interval = "month";
      } else if (apiProductId === configuredPlans.enterprise.yearly) {
        plan = "Enterprise";
        interval = "year";
      } else {
        // Try to identify from product name/price
        const nameLower = productName.toLowerCase();
        const priceNum = parseFloat(productPrice);

        if (nameLower.includes("pro")) {
          plan = "Pro";
        } else if (nameLower.includes("enterprise")) {
          plan = "Enterprise";
        }

        if (nameLower.includes("month") || nameLower.includes("monat")) {
          interval = "month";
        } else if (nameLower.includes("year") || nameLower.includes("jahr")) {
          interval = "year";
        }
      }

      console.log(`   Identified Plan: ${plan} (${interval})`);

      // Store product info
      if (!productIdMap.has(apiProductId)) {
        productIdMap.set(apiProductId, {
          plan,
          interval,
          product,
          users: [],
        });
      }
      productIdMap.get(apiProductId)!.users.push(user.email || user.name || user.id);

      // Check if database needs update
      if (user.polar_product_id !== apiProductId) {
        console.log(
          `   ⚠️  MISMATCH! Database has "${user.polar_product_id}" but Polar API has "${apiProductId}"`
        );
        console.log(`   🔧 Updating database...`);

        const { error: updateError } = await supabase
          .from("users")
          .update({
            polar_product_id: apiProductId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (updateError) {
          console.error(`   ❌ Failed to update: ${updateError.message}`);
        } else {
          console.log(`   ✅ Database updated successfully`);
        }

        // Also update subscriptions table
        const { error: subUpdateError } = await supabase
          .from("subscriptions")
          .update({
            polar_product_id: apiProductId,
            updated_at: new Date().toISOString(),
          })
          .eq("polar_subscription_id", user.polar_subscription_id);

        if (subUpdateError) {
          console.error(`   ⚠️  Failed to update subscriptions table: ${subUpdateError.message}`);
        } else {
          console.log(`   ✅ Subscriptions table updated`);
        }
      } else {
        console.log(`   ✅ Product ID matches database`);
      }

      // Check if product ID matches any configured plan
      const matchesConfig = [
        configuredPlans.pro.monthly,
        configuredPlans.pro.yearly,
        configuredPlans.enterprise.monthly,
        configuredPlans.enterprise.yearly,
      ].includes(apiProductId);

      if (!matchesConfig) {
        console.log(
          `   ⚠️  WARNING: Product ID "${apiProductId}" does not match any configured environment variable!`
        );
        console.log(`   This will cause the plan to show as "Free" in the UI.`);
      } else {
        console.log(`   ✅ Product ID matches configured environment variable`);
      }
    } catch (error: any) {
      console.error(`   ❌ Error processing user: ${error.message}`);
      if (error.stack) {
        console.error(`   Stack: ${error.stack}`);
      }
    }
  }

  // Summary and recommendations
  console.log("\n" + "=".repeat(80));
  console.log("📋 SUMMARY & RECOMMENDATIONS");
  console.log("=".repeat(80));
  console.log("\n");

  if (productIdMap.size > 0) {
    console.log("Found Product IDs in use:\n");

    for (const [productId, { plan, interval, product, users }] of productIdMap) {
      const productName = product.name || "Unknown";
      const matchesConfig = [
        configuredPlans.pro.monthly,
        configuredPlans.pro.yearly,
        configuredPlans.enterprise.monthly,
        configuredPlans.enterprise.yearly,
      ].includes(productId);

      console.log(`Product ID: ${productId}`);
      console.log(`  Name: ${productName}`);
      console.log(`  Identified as: ${plan} (${interval})`);
      console.log(`  Users: ${users.join(", ")}`);
      console.log(
        `  Config Status: ${matchesConfig ? "✅ Configured" : "❌ NOT CONFIGURED"}`
      );

      if (!matchesConfig) {
        // Determine which env var should be set
        let envVar = "";
        if (plan === "Pro" && interval === "month") {
          envVar = "NEXT_PUBLIC_POLAR_PRO_MONTHLY_PLAN_ID";
        } else if (plan === "Pro" && interval === "year") {
          envVar = "NEXT_PUBLIC_POLAR_PRO_YEARLY_PLAN_ID";
        } else if (plan === "Enterprise" && interval === "month") {
          envVar = "NEXT_PUBLIC_POLAR_ENTERPRISE_MONTHLY_PLAN_ID";
        } else if (plan === "Enterprise" && interval === "year") {
          envVar = "NEXT_PUBLIC_POLAR_ENTERPRISE_YEARLY_PLAN_ID";
        }

        if (envVar) {
          console.log(`  ⚠️  Set this environment variable:`);
          console.log(`     ${envVar}=${productId}`);
        } else {
          console.log(`  ⚠️  Could not determine which env var to set.`);
          console.log(`     Please manually identify this product in Polar.sh dashboard.`);
        }
      }
      console.log("");
    }
  }

  console.log("\n💡 Next Steps:");
  console.log("1. If any Product IDs are not configured, set the environment variables in Vercel");
  console.log("2. Redeploy the application");
  console.log("3. Users should now see the correct plan");
  console.log("4. If not, use the Refresh button on /dashboard/billing page");
}

diagnoseAndFix()
  .then(() => {
    console.log("\n✅ Diagnosis complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
