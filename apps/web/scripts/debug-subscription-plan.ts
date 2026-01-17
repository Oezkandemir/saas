#!/usr/bin/env tsx
/**
 * Debug Script: Find users with subscription plan mismatches
 * 
 * This script checks for users who have a polar_product_id but are showing as Free plan
 * due to configuration mismatches.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables!");
  console.error("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get configured plan IDs from environment
const configuredPlans = {
  pro: {
    monthly: process.env.NEXT_PUBLIC_POLAR_PRO_MONTHLY_PLAN_ID || null,
    yearly: process.env.NEXT_PUBLIC_POLAR_PRO_YEARLY_PLAN_ID || null,
  },
  enterprise: {
    monthly: process.env.NEXT_PUBLIC_POLAR_ENTERPRISE_MONTHLY_PLAN_ID || null,
    yearly: process.env.NEXT_PUBLIC_POLAR_ENTERPRISE_YEARLY_PLAN_ID || null,
  },
};

async function debugSubscriptionPlans() {
  console.log("🔍 Checking users with Polar subscriptions...\n");

  // Get all users with Polar subscriptions
  const { data: users, error } = await supabase
    .from("users")
    .select(
      "id, email, name, polar_product_id, polar_subscription_id, polar_customer_id, polar_current_period_end, payment_provider"
    )
    .not("polar_subscription_id", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error fetching users:", error);
    process.exit(1);
  }

  if (!users || users.length === 0) {
    console.log("✅ No users with Polar subscriptions found.");
    return;
  }

  console.log(`📊 Found ${users.length} users with Polar subscriptions\n`);
  console.log("📋 Configured Plan IDs:");
  console.log("  Pro Monthly:", configuredPlans.pro.monthly || "❌ NOT SET");
  console.log("  Pro Yearly:", configuredPlans.pro.yearly || "❌ NOT SET");
  console.log("  Enterprise Monthly:", configuredPlans.enterprise.monthly || "❌ NOT SET");
  console.log("  Enterprise Yearly:", configuredPlans.enterprise.yearly || "❌ NOT SET");
  console.log("\n");

  const mismatches: Array<{
    user: typeof users[0];
    issue: string;
    expectedPlan?: string;
  }> = [];

  for (const user of users) {
    const productId = user.polar_product_id;
    
    if (!productId) {
      mismatches.push({
        user,
        issue: "No polar_product_id set",
      });
      continue;
    }

    // Check if product ID matches any configured plan
    const matchesProMonthly = productId === configuredPlans.pro.monthly;
    const matchesProYearly = productId === configuredPlans.pro.yearly;
    const matchesEnterpriseMonthly = productId === configuredPlans.enterprise.monthly;
    const matchesEnterpriseYearly = productId === configuredPlans.enterprise.yearly;

    if (!matchesProMonthly && !matchesProYearly && !matchesEnterpriseMonthly && !matchesEnterpriseYearly) {
      let expectedPlan = "Unknown";
      if (configuredPlans.enterprise.monthly && productId.includes(configuredPlans.enterprise.monthly.substring(0, 8))) {
        expectedPlan = "Enterprise Monthly";
      } else if (configuredPlans.enterprise.yearly && productId.includes(configuredPlans.enterprise.yearly.substring(0, 8))) {
        expectedPlan = "Enterprise Yearly";
      } else if (configuredPlans.pro.monthly && productId.includes(configuredPlans.pro.monthly.substring(0, 8))) {
        expectedPlan = "Pro Monthly";
      } else if (configuredPlans.pro.yearly && productId.includes(configuredPlans.pro.yearly.substring(0, 8))) {
        expectedPlan = "Pro Yearly";
      }

      mismatches.push({
        user,
        issue: `Product ID "${productId}" does not match any configured plan IDs`,
        expectedPlan,
      });
    }
  }

  // Display results
  console.log("=".repeat(80));
  console.log("📊 SUBSCRIPTION PLAN ANALYSIS");
  console.log("=".repeat(80));
  console.log("\n");

  if (mismatches.length === 0) {
    console.log("✅ All users have matching product IDs!");
  } else {
    console.log(`⚠️  Found ${mismatches.length} user(s) with mismatched product IDs:\n`);
    
    for (const mismatch of mismatches) {
      console.log(`👤 User: ${mismatch.user.email || mismatch.user.name || mismatch.user.id}`);
      console.log(`   Product ID: ${mismatch.user.polar_product_id || "NULL"}`);
      console.log(`   Subscription ID: ${mismatch.user.polar_subscription_id || "NULL"}`);
      console.log(`   Issue: ${mismatch.issue}`);
      if (mismatch.expectedPlan) {
        console.log(`   Expected Plan: ${mismatch.expectedPlan}`);
      }
      console.log("");
    }

    console.log("\n💡 SOLUTION:");
    console.log("1. Check if the polar_product_id in the database matches the Product ID in Polar.sh");
    console.log("2. Verify that NEXT_PUBLIC_POLAR_ENTERPRISE_MONTHLY_PLAN_ID and");
    console.log("   NEXT_PUBLIC_POLAR_ENTERPRISE_YEARLY_PLAN_ID are set correctly in Vercel");
    console.log("3. Run the sync function to update the user's polar_product_id from Polar API");
    console.log("4. Use the Refresh button on /dashboard/billing to sync subscription");
  }

  // Show all users for reference
  console.log("\n" + "=".repeat(80));
  console.log("📋 ALL USERS WITH SUBSCRIPTIONS");
  console.log("=".repeat(80));
  console.log("\n");

  for (const user of users) {
    const productId = user.polar_product_id;
    let planName = "❓ Unknown";
    
    if (productId === configuredPlans.pro.monthly) planName = "✅ Pro (Monthly)";
    else if (productId === configuredPlans.pro.yearly) planName = "✅ Pro (Yearly)";
    else if (productId === configuredPlans.enterprise.monthly) planName = "✅ Enterprise (Monthly)";
    else if (productId === configuredPlans.enterprise.yearly) planName = "✅ Enterprise (Yearly)";
    else if (productId) planName = "❌ No Match";

    console.log(`${planName.padEnd(25)} | ${user.email?.padEnd(40) || "N/A".padEnd(40)} | Product ID: ${productId || "NULL"}`);
  }
}

debugSubscriptionPlans()
  .then(() => {
    console.log("\n✅ Debug complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
