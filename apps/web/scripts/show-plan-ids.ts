#!/usr/bin/env tsx
/**
 * Show Plan IDs Script
 * 
 * This script shows the Product IDs from the database and provides
 * instructions on how to set the environment variables in Vercel.
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

async function showPlanIds() {
  console.log("🔍 Analyzing Product IDs from database...\n");

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

  // Group by product ID
  const productIdGroups = new Map<
    string,
    { users: typeof users; count: number }
  >();

  for (const user of users) {
    if (!user.polar_product_id) continue;

    if (!productIdGroups.has(user.polar_product_id)) {
      productIdGroups.set(user.polar_product_id, {
        users: [user],
        count: 1,
      });
    } else {
      const existing = productIdGroups.get(user.polar_product_id)!;
      existing.users.push(user);
      existing.count++;
    }
  }

  console.log("=".repeat(80));
  console.log("📋 PRODUCT IDs FOUND IN DATABASE");
  console.log("=".repeat(80));
  console.log("\n");

  const productIds = Array.from(productIdGroups.entries());

  for (const [productId, { users, count }] of productIds) {
    console.log(`Product ID: ${productId}`);
    console.log(`  Users: ${count}`);
    console.log(`  Emails: ${users.map((u) => u.email || u.name || u.id).join(", ")}`);
    console.log("");
  }

  console.log("=".repeat(80));
  console.log("🔧 ENVIRONMENT VARIABLES TO SET IN VERCEL");
  console.log("=".repeat(80));
  console.log("\n");

  console.log("⚠️  IMPORTANT: You need to identify which Product ID corresponds to which plan!");
  console.log("   Check in Polar.sh Dashboard which Product ID is for which plan.\n");

  if (productIds.length >= 1) {
    console.log("Based on the Product IDs found, set these in Vercel:\n");

    // Show all found product IDs - user needs to identify which is which
    productIds.forEach(([productId, { users }], index) => {
      const userEmails = users.map((u) => u.email || u.name).join(", ");
      console.log(`# Product ID ${index + 1}: ${productId}`);
      console.log(`# Used by: ${userEmails}`);
      console.log(`# TODO: Check in Polar.sh which plan this is (Pro/Enterprise, Monthly/Yearly)`);
      console.log(`NEXT_PUBLIC_POLAR_XXX_PLAN_ID=${productId}`);
      console.log("");
    });

    console.log("\n💡 To identify the correct plan:");
    console.log("1. Go to https://polar.sh (or sandbox.polar.sh if using sandbox)");
    console.log("2. Navigate to Products");
    console.log("3. Find each Product ID above");
    console.log("4. Check the product name and price:");
    console.log("   - Pro Monthly: ~10€/month");
    console.log("   - Pro Yearly: ~100€/year");
    console.log("   - Enterprise Monthly: ~20€/month");
    console.log("   - Enterprise Yearly: ~200€/year");
    console.log("\n5. Set the correct environment variable:");
    console.log("   - NEXT_PUBLIC_POLAR_PRO_MONTHLY_PLAN_ID for Pro Monthly");
    console.log("   - NEXT_PUBLIC_POLAR_PRO_YEARLY_PLAN_ID for Pro Yearly");
    console.log("   - NEXT_PUBLIC_POLAR_ENTERPRISE_MONTHLY_PLAN_ID for Enterprise Monthly");
    console.log("   - NEXT_PUBLIC_POLAR_ENTERPRISE_YEARLY_PLAN_ID for Enterprise Yearly");
  } else {
    console.log("❌ No Product IDs found in database.");
  }

  console.log("\n" + "=".repeat(80));
  console.log("📝 CURRENT ENVIRONMENT VARIABLES STATUS");
  console.log("=".repeat(80));
  console.log("\n");

  const currentEnvVars = {
    proMonthly: process.env.NEXT_PUBLIC_POLAR_PRO_MONTHLY_PLAN_ID || null,
    proYearly: process.env.NEXT_PUBLIC_POLAR_PRO_YEARLY_PLAN_ID || null,
    enterpriseMonthly:
      process.env.NEXT_PUBLIC_POLAR_ENTERPRISE_MONTHLY_PLAN_ID || null,
    enterpriseYearly:
      process.env.NEXT_PUBLIC_POLAR_ENTERPRISE_YEARLY_PLAN_ID || null,
  };

  console.log("Pro Monthly:", currentEnvVars.proMonthly || "❌ NOT SET");
  console.log("Pro Yearly:", currentEnvVars.proYearly || "❌ NOT SET");
  console.log(
    "Enterprise Monthly:",
    currentEnvVars.enterpriseMonthly || "❌ NOT SET"
  );
  console.log(
    "Enterprise Yearly:",
    currentEnvVars.enterpriseYearly || "❌ NOT SET"
  );

  console.log("\n✅ Analysis complete!");
}

showPlanIds()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
