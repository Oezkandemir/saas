/**
 * Get Stripe Account Information and Products
 * Reads STRIPE_API_KEY from .env file and shows account details
 */

const fs = require("fs");
const path = require("path");
const stripe = require("stripe");

// Read .env file manually
function readEnvFile() {
  const envPath = path.join(__dirname, "..", ".env");
  const envLocalPath = path.join(__dirname, "..", ".env.local");

  let envContent = "";

  // Try .env.local first, then .env
  if (fs.existsSync(envLocalPath)) {
    envContent = fs.readFileSync(envLocalPath, "utf8");
  } else if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
  } else {
    console.error("❌ Keine .env oder .env.local Datei gefunden");
    return {};
  }

  const env = {};
  envContent.split("\n").forEach((line) => {
    line = line.trim();
    if (line && !line.startsWith("#")) {
      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts
          .join("=")
          .trim()
          .replace(/^["']|["']$/g, "");
      }
    }
  });

  return env;
}

async function getStripeInfo() {
  const env = readEnvFile();

  const apiKey = env.STRIPE_API_KEY || env.NEXT_PUBLIC_STRIPE_API_KEY;

  if (!apiKey) {
    console.error("❌ STRIPE_API_KEY nicht gefunden in .env Datei");
    console.log("\nBitte fügen Sie hinzu:");
    console.log("STRIPE_API_KEY=sk_test_xxxxx");
    console.log("\nIn: apps/web/.env oder apps/web/.env.local\n");
    return;
  }

  console.log("🔍 Verbinde mit Stripe Account...\n");
  console.log("API Key gefunden:", apiKey.substring(0, 20) + "...\n");

  try {
    const stripeClient = stripe(apiKey);

    // Get account information
    const account = await stripeClient.accounts.retrieve();

    console.log("✅ Stripe Account gefunden!\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 Account E-Mail:", account.email || "Nicht verfügbar");
    console.log(
      "🏢 Account Name:",
      account.business_profile?.name ||
        account.display_name ||
        "Nicht verfügbar",
    );
    console.log("🌍 Land:", account.country || "Nicht verfügbar");
    console.log("💳 Account Typ:", account.type || "Nicht verfügbar");
    console.log(
      "📊 Account Status:",
      account.details_submitted ? "✅ Verifiziert" : "⚠️  Nicht verifiziert",
    );
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Get products
    console.log("📦 Produkte und Price IDs:\n");
    const products = await stripeClient.products.list({ limit: 100 });

    if (products.data.length === 0) {
      console.log("   ⚠️  Keine Produkte gefunden.");
      console.log("   Erstellen Sie Produkte in Stripe Dashboard.\n");
    } else {
      for (const product of products.data) {
        console.log(`   📦 ${product.name}`);
        console.log(`      Product ID: ${product.id}`);

        // Get prices for this product
        const prices = await stripeClient.prices.list({
          product: product.id,
          limit: 100,
        });

        if (prices.data.length === 0) {
          console.log("      ⚠️  Keine Preise für dieses Produkt!\n");
        } else {
          console.log("      💰 Preise:");
          for (const price of prices.data) {
            const amount = (price.unit_amount / 100).toFixed(2);
            const currency = price.currency.toUpperCase();
            const interval = price.recurring?.interval || "one-time";
            const intervalCount = price.recurring?.interval_count || 1;

            console.log(
              `         - ${currency} ${amount} / ${intervalCount} ${interval}`,
            );
            console.log(`           ✅ Price ID: ${price.id}`);
          }
          console.log("");
        }
      }
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📝 Nächste Schritte:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("1. Kopieren Sie die Price IDs oben");
    console.log("2. Fügen Sie sie in apps/web/.env.local ein:\n");
    console.log("   # Für Pro Plan (10€/Monat)");
    console.log("   NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID=price_xxxxx");
    console.log("   NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID=price_xxxxx");
    console.log("");
    console.log("   # Für Enterprise Plan (20€/Monat)");
    console.log("   NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID=price_xxxxx");
    console.log("   NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID=price_xxxxx");
    console.log("\n3. Starten Sie den Server neu: pnpm dev\n");
  } catch (error) {
    console.error("\n❌ Fehler:", error.message);

    if (error.message.includes("No API key")) {
      console.error("\n   STRIPE_API_KEY nicht gefunden");
    } else if (
      error.message.includes("Invalid API Key") ||
      error.type === "StripeAuthenticationError"
    ) {
      console.error("\n   ⚠️  Ungültige Stripe API Key");
      console.error("   Überprüfen Sie, ob Sie den richtigen Key verwenden");
      console.error("   Test Keys beginnen mit: sk_test_...");
      console.error("   Live Keys beginnen mit: sk_live_...");
    } else {
      console.error("\n   Details:", error);
    }
  }
}

getStripeInfo();


