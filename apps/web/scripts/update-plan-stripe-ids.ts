/**
 * Script to update Stripe Price IDs in the database from environment variables
 *
 * Usage:
 * 1. Make sure your .env.local has the Stripe Price IDs set:
 *    NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID=price_xxx
 *    NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID=price_xxx
 *    NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID=price_xxx
 *    NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID=price_xxx
 *
 * 2. Run: npx tsx scripts/update-plan-stripe-ids.ts
 */

import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

import { logger } from "@/lib/logger";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updatePlanStripeIds() {
  logger.debug("🔄 Updating Stripe Price IDs in database...\n");

  // Get Price IDs from environment
  const proMonthly = process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID;
  const proYearly = process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID;
  const businessMonthly =
    process.env.NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID;
  const businessYearly = process.env.NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID;

  logger.debug("📋 Environment Variables:");
  logger.debug(`  PRO_MONTHLY: ${proMonthly || "❌ Not set"}`);
  logger.debug(`  PRO_YEARLY: ${proYearly || "❌ Not set"}`);
  logger.debug(`  BUSINESS_MONTHLY: ${businessMonthly || "❌ Not set"}`);
  logger.debug(`  BUSINESS_YEARLY: ${businessYearly || "❌ Not set"}\n`);

  // Update Pro Plan
  if (proMonthly || proYearly) {
    const { data, error } = await supabase
      .from("plans")
      .update({
        stripe_price_id_monthly: proMonthly || null,
        stripe_price_id_yearly: proYearly || null,
        updated_at: new Date().toISOString(),
      })
      .eq("plan_key", "pro")
      .select();

    if (error) {
      logger.error(`❌ Error updating Pro plan:`, error);
    } else {
      logger.debug(`✅ Updated Pro plan:`, data[0]);
    }
  }

  // Update Enterprise Plan (uses BUSINESS price IDs)
  if (businessMonthly || businessYearly) {
    const { data, error } = await supabase
      .from("plans")
      .update({
        stripe_price_id_monthly: businessMonthly || null,
        stripe_price_id_yearly: businessYearly || null,
        updated_at: new Date().toISOString(),
      })
      .eq("plan_key", "enterprise")
      .select();

    if (error) {
      logger.error(`❌ Error updating Enterprise plan:`, error);
    } else {
      logger.debug(`✅ Updated Enterprise plan:`, data[0]);
    }
  }

  // Show current state
  logger.debug("\n📊 Current Plans in Database:");
  const { data: plans, error: plansError } = await supabase
    .from("plans")
    .select(
      "id, title, plan_key, stripe_price_id_monthly, stripe_price_id_yearly",
    )
    .order("sort_order");

  if (plansError) {
    logger.error("❌ Error fetching plans:", plansError);
  } else {
    plans.forEach((plan) => {
      logger.debug(`\n  ${plan.title} (${plan.plan_key}):`);
      logger.debug(
        `    Monthly: ${plan.stripe_price_id_monthly || "❌ Not set"}`,
      );
      logger.debug(
        `    Yearly: ${plan.stripe_price_id_yearly || "❌ Not set"}`,
      );
    });
  }

  logger.debug("\n✨ Done!");
}

updatePlanStripeIds().catch(console.error);



