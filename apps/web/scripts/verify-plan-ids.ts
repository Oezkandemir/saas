#!/usr/bin/env tsx
/**
 * Verify Plan IDs Script
 * 
 * This script verifies that all Polar Plan IDs are correctly set and match
 * the Product IDs in the database.
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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// UUID validation regex
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(str: string | undefined): boolean {
  if (!str || str.trim() === "") return false;
  return UUID_REGEX.test(str.trim());
}

async function verifyPlanIds() {
  console.log("🔍 Verifying Polar Plan IDs configuration...\n");

  // Get configured plan IDs from environment
  const configuredPlans = {
    pro: {
      monthly: process.env.NEXT_PUBLIC_POLAR_PRO_MONTHLY_PLAN_ID,
      yearly: process.env.NEXT_PUBLIC_POLAR_PRO_YEARLY_PLAN_ID,
    },
    enterprise: {
      monthly: process.env.NEXT_PUBLIC_POLAR_ENTERPRISE_MONTHLY_PLAN_ID,
      yearly: process.env.NEXT_PUBLIC_POLAR_ENTERPRISE_YEARLY_PLAN_ID,
    },
  };

  console.log("📋 Environment Variables Status:\n");

  const planStatus = {
    proMonthly: {
      set: !!configuredPlans.pro.monthly,
      valid: isValidUUID(configuredPlans.pro.monthly),
      value: configuredPlans.pro.monthly || "NOT SET",
    },
    proYearly: {
      set: !!configuredPlans.pro.yearly,
      valid: isValidUUID(configuredPlans.pro.yearly),
      value: configuredPlans.pro.yearly || "NOT SET",
    },
    enterpriseMonthly: {
      set: !!configuredPlans.enterprise.monthly,
      valid: isValidUUID(configuredPlans.enterprise.monthly),
      value: configuredPlans.enterprise.monthly || "NOT SET",
    },
    enterpriseYearly: {
      set: !!configuredPlans.enterprise.yearly,
      valid: isValidUUID(configuredPlans.enterprise.yearly),
      value: configuredPlans.enterprise.yearly || "NOT SET",
    },
  };

  console.log("Pro Monthly:");
  console.log(
    `  Status: ${planStatus.proMonthly.valid ? "✅ Valid UUID" : planStatus.proMonthly.set ? "❌ Invalid UUID" : "⚠️  Not Set"}`
  );
  console.log(`  Value: ${planStatus.proMonthly.value}\n`);

  console.log("Pro Yearly:");
  console.log(
    `  Status: ${planStatus.proYearly.valid ? "✅ Valid UUID" : planStatus.proYearly.set ? "❌ Invalid UUID" : "⚠️  Not Set"}`
  );
  console.log(`  Value: ${planStatus.proYearly.value}\n`);

  console.log("Enterprise Monthly:");
  console.log(
    `  Status: ${planStatus.enterpriseMonthly.valid ? "✅ Valid UUID" : planStatus.enterpriseMonthly.set ? "❌ Invalid UUID" : "⚠️  Not Set"}`
  );
  console.log(`  Value: ${planStatus.enterpriseMonthly.value}\n`);

  console.log("Enterprise Yearly:");
  console.log(
    `  Status: ${planStatus.enterpriseYearly.valid ? "✅ Valid UUID" : planStatus.enterpriseYearly.set ? "❌ Invalid UUID" : "⚠️  Not Set"}`
  );
  console.log(`  Value: ${planStatus.enterpriseYearly.value}\n`);

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

  console.log("=".repeat(80));
  console.log("📊 USER SUBSCRIPTION MATCHING");
  console.log("=".repeat(80));
  console.log("\n");

  let matchedCount = 0;
  let unmatchedCount = 0;

  for (const user of users) {
    if (!user.polar_product_id) {
      console.log(`❌ ${user.email || user.name || user.id}: No product ID`);
      unmatchedCount++;
      continue;
    }

    const productId = user.polar_product_id;
    let matched = false;
    let matchedPlan = "Unknown";

    // Check against configured plans
    if (productId === configuredPlans.pro.monthly) {
      matched = true;
      matchedPlan = "✅ Pro (Monthly)";
    } else if (productId === configuredPlans.pro.yearly) {
      matched = true;
      matchedPlan = "✅ Pro (Yearly)";
    } else if (productId === configuredPlans.enterprise.monthly) {
      matched = true;
      matchedPlan = "✅ Enterprise (Monthly)";
    } else if (productId === configuredPlans.enterprise.yearly) {
      matched = true;
      matchedPlan = "✅ Enterprise (Yearly)";
    }

    if (matched) {
      matchedCount++;
      console.log(`${matchedPlan} | ${user.email || user.name || user.id}`);
      console.log(`   Product ID: ${productId}\n`);
    } else {
      unmatchedCount++;
      console.log(`❌ No Match | ${user.email || user.name || user.id}`);
      console.log(`   Product ID: ${productId}`);
      console.log(`   Issue: Product ID doesn't match any configured plan IDs\n`);
    }
  }

  console.log("=".repeat(80));
  console.log("📈 SUMMARY");
  console.log("=".repeat(80));
  console.log("\n");

  const allValid =
    planStatus.proMonthly.valid &&
    planStatus.proYearly.valid &&
    planStatus.enterpriseMonthly.valid &&
    planStatus.enterpriseYearly.valid;

  if (allValid) {
    console.log("✅ All Plan IDs are valid UUIDs!");
  } else {
    console.log("⚠️  Some Plan IDs are missing or invalid:");
    if (!planStatus.proMonthly.valid)
      console.log("   - NEXT_PUBLIC_POLAR_PRO_MONTHLY_PLAN_ID");
    if (!planStatus.proYearly.valid)
      console.log("   - NEXT_PUBLIC_POLAR_PRO_YEARLY_PLAN_ID");
    if (!planStatus.enterpriseMonthly.valid)
      console.log("   - NEXT_PUBLIC_POLAR_ENTERPRISE_MONTHLY_PLAN_ID");
    if (!planStatus.enterpriseYearly.valid)
      console.log("   - NEXT_PUBLIC_POLAR_ENTERPRISE_YEARLY_PLAN_ID");
  }

  console.log(`\n📊 User Matching:`);
  console.log(`   ✅ Matched: ${matchedCount}`);
  console.log(`   ❌ Unmatched: ${unmatchedCount}`);

  if (unmatchedCount > 0) {
    console.log(
      `\n💡 For unmatched users, use the Refresh button on /dashboard/billing to sync their subscriptions.`
    );
  }

  console.log("\n✅ Verification complete!");
}

verifyPlanIds()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
