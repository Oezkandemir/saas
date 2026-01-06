#!/usr/bin/env tsx
/**
 * Script to check page_views table structure and data
 * Run with: npx tsx scripts/check-page-views.ts
 */
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPageViews() {
  console.log("🔍 Checking page_views table...\n");

  try {
    // First, check table structure
    console.log("1. Checking table structure...");
    const { data: sampleData, error: sampleError } = await supabase
      .from("page_views")
      .select("*")
      .limit(1);

    if (sampleError) {
      console.error("❌ Error accessing page_views table:", sampleError);
      return;
    }

    if (sampleData && sampleData.length > 0) {
      console.log("✅ Table structure:");
      console.log("Columns:", Object.keys(sampleData[0]));
      console.log("Sample row:", JSON.stringify(sampleData[0], null, 2));
    } else {
      console.log("⚠️  Table exists but is empty");
    }

    console.log("\n2. Checking all columns...");
    const { data: allData, error: allError } = await supabase
      .from("page_views")
      .select("slug, page_path, view_count, created_at, session_id, user_id")
      .limit(10);

    if (allError) {
      console.error("❌ Error fetching data:", allError);
      return;
    }

    console.log(
      `\n📊 Found ${allData?.length || 0} records (showing first 10):`,
    );
    if (allData && allData.length > 0) {
      allData.forEach((row: any, index: number) => {
        console.log(`\nRow ${index + 1}:`);
        console.log(`  slug: ${row.slug || "NULL"}`);
        console.log(`  page_path: ${row.page_path || "NULL"}`);
        console.log(`  view_count: ${row.view_count || "NULL"}`);
        console.log(`  created_at: ${row.created_at || "NULL"}`);
      });
    } else {
      console.log("⚠️  No data found in page_views table");
    }

    console.log("\n3. Aggregating by slug...");
    const { data: slugData, error: slugError } = await supabase
      .from("page_views")
      .select("slug, view_count")
      .order("view_count", { ascending: false })
      .limit(10);

    if (!slugError && slugData && slugData.length > 0) {
      console.log(`\n📈 Top pages by slug (${slugData.length} records):`);
      slugData.forEach((row: any, index: number) => {
        console.log(
          `  ${index + 1}. ${row.slug || "NULL"}: ${row.view_count || 0} views`,
        );
      });
    } else {
      console.log("⚠️  No aggregated data by slug");
    }

    console.log("\n4. Checking total count...");
    const { count, error: countError } = await supabase
      .from("page_views")
      .select("*", { count: "exact", head: true });

    if (!countError) {
      console.log(`\n📊 Total records in page_views: ${count || 0}`);
    } else {
      console.error("❌ Error counting records:", countError);
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

checkPageViews()
  .then(() => {
    console.log("\n✅ Check complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });


