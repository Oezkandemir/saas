/**
 * Sync Stripe Prices with Configuration
 *
 * This script creates or updates Stripe products and prices based on the configuration
 * in config/subscriptions.ts
 *
 * Usage:
 * 1. Set STRIPE_API_KEY in your .env.local
 * 2. Run: node scripts/sync-stripe-prices.js
 *
 * The script will:
 * - Find or create products (Pro Plan, Enterprise Plan)
 * - Create or update prices (monthly and yearly)
 * - Output the Price IDs to add to .env.local
 */

const path = require("node:path");
const fs = require("node:fs");

// Try multiple paths for .env.local
const envPaths = [
  path.join(__dirname, "..", ".env.local"),
  path.join(process.cwd(), ".env.local"),
  ".env.local",
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require("dotenv").config({ path: envPath });
    envLoaded = true;
    console.log(`📁 Loading .env.local from: ${envPath}`);
    break;
  }
}

if (!envLoaded) {
  // Fallback: try default dotenv
  require("dotenv").config();
}

const stripe = require("stripe")(process.env.STRIPE_API_KEY);

// Price configuration matching config/subscriptions.ts
const priceConfig = [
  {
    productName: "Pro Plan",
    productDescription: "Für professionelle Nutzer",
    prices: [
      { amount: 1000, currency: "eur", interval: "month", intervalCount: 1 }, // €10/month
      { amount: 10000, currency: "eur", interval: "year", intervalCount: 1 }, // €100/year
    ],
    envVars: {
      monthly: "NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID",
      yearly: "NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID",
    },
  },
  {
    productName: "Enterprise Plan",
    productDescription: "Für große Unternehmen",
    prices: [
      { amount: 2000, currency: "eur", interval: "month", intervalCount: 1 }, // €20/month
      { amount: 20000, currency: "eur", interval: "year", intervalCount: 1 }, // €200/year
    ],
    envVars: {
      monthly: "NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID",
      yearly: "NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID",
    },
  },
];

async function findOrCreateProduct(name, description) {
  // First, try to find existing product
  const products = await stripe.products.list({ limit: 100 });
  const existingProduct = products.data.find(
    (p) => p.name === name && !p.deleted
  );

  if (existingProduct) {
    console.log(
      `   ✅ Found existing product: ${name} (${existingProduct.id})`
    );

    // Update description if it's different
    if (existingProduct.description !== description) {
      await stripe.products.update(existingProduct.id, {
        description: description,
      });
      console.log(`   📝 Updated product description`);
    }

    return existingProduct;
  }

  // Create new product
  const product = await stripe.products.create({
    name: name,
    description: description,
  });

  console.log(`   ✅ Created new product: ${name} (${product.id})`);
  return product;
}

async function findOrCreatePrice(
  productId,
  amount,
  currency,
  interval,
  intervalCount
) {
  // First, check if a price with these exact parameters already exists
  const prices = await stripe.prices.list({
    product: productId,
    limit: 100,
  });

  // Find matching price
  const existingPrice = prices.data.find(
    (p) =>
      !p.deleted &&
      p.active &&
      p.unit_amount === amount &&
      p.currency === currency &&
      p.recurring?.interval === interval &&
      p.recurring?.interval_count === intervalCount
  );

  if (existingPrice) {
    console.log(
      `      ✅ Found existing price: ${(amount / 100).toFixed(2)} ${currency.toUpperCase()} / ${intervalCount} ${interval} (${existingPrice.id})`
    );
    return existingPrice;
  }

  // Create new price
  const price = await stripe.prices.create({
    product: productId,
    unit_amount: amount,
    currency: currency,
    recurring: {
      interval: interval,
      interval_count: intervalCount,
    },
  });

  console.log(
    `      ✅ Created new price: ${(amount / 100).toFixed(2)} ${currency.toUpperCase()} / ${intervalCount} ${interval} (${price.id})`
  );
  return price;
}

async function syncStripePrices() {
  // Debug: Show what was loaded
  if (!process.env.STRIPE_API_KEY) {
    console.error("❌ STRIPE_API_KEY nicht gefunden");
    console.error(
      "   Bitte setzen Sie STRIPE_API_KEY in Ihrer .env.local Datei"
    );

    // Debug info
    const envKeys = Object.keys(process.env).filter((k) =>
      k.includes("STRIPE")
    );
    if (envKeys.length > 0) {
      console.log("\n   Gefundene Stripe-Variablen:");
      for (const k of envKeys) {
        console.log(`     - ${k}`);
      }
    }
    return;
  }

  const isTestMode = process.env.STRIPE_API_KEY.startsWith("sk_test_");
  const mode = isTestMode ? "TEST" : "LIVE";

  console.log(`🚀 Stripe Price Sync (${mode}-Modus)\n`);
  console.log(
    `   API Key: ${process.env.STRIPE_API_KEY.substring(0, 12)}...${process.env.STRIPE_API_KEY.substring(process.env.STRIPE_API_KEY.length - 4)}\n`
  );

  const results = {};

  try {
    for (const config of priceConfig) {
      console.log(`📦 Processing: ${config.productName}`);

      // Find or create product
      const product = await findOrCreateProduct(
        config.productName,
        config.productDescription
      );

      results[config.productName] = {
        productId: product.id,
        prices: {},
      };

      // Process each price
      for (const priceConfigItem of config.prices) {
        const interval = priceConfigItem.interval;
        // Map interval to envVar key (month -> monthly, year -> yearly)
        const envVarKey = interval === "month" ? "monthly" : "yearly";

        const price = await findOrCreatePrice(
          product.id,
          priceConfigItem.amount,
          priceConfigItem.currency,
          priceConfigItem.interval,
          priceConfigItem.intervalCount
        );

        results[config.productName].prices[interval] = {
          priceId: price.id,
          amount: priceConfigItem.amount,
          currency: priceConfigItem.currency,
          envVar: config.envVars[envVarKey],
          interval: interval,
        };
      }

      console.log("");
    }

    // Output results
    console.log(`\n${"=".repeat(60)}`);
    console.log("✅ SYNC ABGESCHLOSSEN\n");
    console.log("📝 Fügen Sie diese Price IDs zu Ihrer .env.local hinzu:\n");

    for (const config of priceConfig) {
      const result = results[config.productName];
      console.log(`# ${config.productName}`);

      // Sort prices: monthly first, then yearly
      const sortedPrices = Object.entries(result.prices).sort(([a], [b]) => {
        if (a === "month") return -1;
        if (b === "month") return 1;
        return 0;
      });

      for (const [interval, priceInfo] of sortedPrices) {
        const amount = (priceInfo.amount / 100).toFixed(2);
        const currency = priceInfo.currency.toUpperCase();
        const envVar = priceInfo.envVar;
        console.log(
          `${envVar}=${priceInfo.priceId}  # ${currency} ${amount} / ${interval}`
        );
      }
      console.log("");
    }

    console.log("=".repeat(60));
    console.log("\n💡 Nach dem Aktualisieren der .env.local Datei:");
    console.log("   1. Starten Sie den Server neu");
    console.log("   2. Führen Sie aus: node scripts/validate-stripe-prices.js");
    console.log("   3. Überprüfen Sie die Pricing-Seite\n");
  } catch (error) {
    console.error("\n❌ Fehler beim Synchronisieren:", error.message);
    if (error.type === "StripeAuthenticationError") {
      console.error("   → Überprüfen Sie Ihre STRIPE_API_KEY");
    } else if (error.type === "StripeInvalidRequestError") {
      console.error(`   → ${error.message}`);
    }
    process.exit(1);
  }
}

syncStripePrices();
