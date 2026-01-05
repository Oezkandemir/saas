/**
 * Validate Stripe Price IDs
 * Checks if the Price IDs in .env.local are valid and exist in Stripe
 */

require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

const stripe = require("stripe")(process.env.STRIPE_API_KEY);

async function validatePrices() {
  if (!process.env.STRIPE_API_KEY) {
    console.error("❌ STRIPE_API_KEY nicht gefunden");
    console.error(
      "   Bitte setzen Sie STRIPE_API_KEY in Ihrer .env.local Datei",
    );
    return;
  }

  // Check if we're using test or live mode
  const isTestMode = process.env.STRIPE_API_KEY.startsWith("sk_test_");
  const mode = isTestMode ? "TEST" : "LIVE";

  console.log(`🔍 Validiere Stripe Price IDs (${mode}-Modus)...\n`);
  console.log(
    `   API Key: ${process.env.STRIPE_API_KEY.substring(0, 12)}...${process.env.STRIPE_API_KEY.substring(process.env.STRIPE_API_KEY.length - 4)}\n`,
  );

  const priceIds = [
    {
      name: "Pro Monthly",
      envVar: "NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID",
      id: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID,
    },
    {
      name: "Pro Yearly",
      envVar: "NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID",
      id: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID,
    },
    {
      name: "Business/Enterprise Monthly",
      envVar: "NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID",
      id: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID,
    },
    {
      name: "Business/Enterprise Yearly",
      envVar: "NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID",
      id: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID,
    },
  ];

  let validCount = 0;
  let invalidCount = 0;
  let missingCount = 0;

  for (const { name, envVar, id } of priceIds) {
    if (!id || id.trim() === "") {
      console.log(`❌ ${name}: NICHT GESETZT`);
      console.log(`   Environment Variable: ${envVar}`);
      console.log(`   → Bitte setzen Sie diese Variable in .env.local\n`);
      missingCount++;
      continue;
    }

    if (!id.startsWith("price_")) {
      console.log(`❌ ${name}: UNGÜLTIGES FORMAT`);
      console.log(`   Price ID: ${id}`);
      console.log(`   Environment Variable: ${envVar}`);
      console.log(`   → Price IDs müssen mit 'price_' beginnen`);
      if (id.startsWith("prod_")) {
        console.log(`   → Sie verwenden eine Product ID statt einer Price ID!`);
        console.log(
          `   → Gehen Sie zu Stripe Dashboard > Products > [Ihr Produkt] > Pricing`,
        );
        console.log(`   → Kopieren Sie die Price ID (nicht die Product ID)\n`);
      } else {
        console.log("");
      }
      invalidCount++;
      continue;
    }

    try {
      const price = await stripe.prices.retrieve(id);
      const amount = (price.unit_amount / 100).toFixed(2);
      const currency = price.currency.toUpperCase();
      const interval = price.recurring?.interval || "one-time";

      if (!price.active) {
        console.log(`⚠️  ${name}: INAKTIV`);
        console.log(`   Price ID: ${id}`);
        console.log(`   Betrag: ${currency} ${amount} / ${interval}`);
        console.log(`   → Diese Price ID existiert, ist aber nicht aktiv`);
        console.log(
          `   → Aktivieren Sie sie in Stripe Dashboard oder verwenden Sie eine andere Price ID\n`,
        );
        invalidCount++;
      } else {
        console.log(`✅ ${name}:`);
        console.log(`   Price ID: ${id}`);
        console.log(`   Betrag: ${currency} ${amount} / ${interval}`);
        console.log(`   Status: Aktiv\n`);
        validCount++;
      }
    } catch (error) {
      if (error.code === "resource_missing") {
        console.log(`❌ ${name}: EXISTIERT NICHT IN STRIPE`);
        console.log(`   Price ID: ${id}`);
        console.log(`   Environment Variable: ${envVar}`);
        console.log(
          `   → Diese Price ID existiert nicht in Ihrem Stripe ${mode}-Account`,
        );
        console.log(`   → Mögliche Ursachen:`);
        console.log(`     - Price ID wurde gelöscht oder archiviert`);
        console.log(`     - Price ID stammt aus einem anderen Stripe Account`);
        console.log(
          `     - Sie verwenden ${mode}-Modus, aber die Price ID ist aus dem anderen Modus`,
        );
        console.log(`   → Lösung:`);
        console.log(
          `     1. Gehen Sie zu Stripe Dashboard (${mode}-Modus) > Products`,
        );
        console.log(`     2. Wählen Sie Ihr Produkt aus`);
        console.log(`     3. Scrollen Sie zu "Pricing"`);
        console.log(`     4. Kopieren Sie die aktuelle Price ID`);
        console.log(`     5. Aktualisieren Sie ${envVar} in .env.local`);
        console.log(`     6. Starten Sie den Server neu\n`);
        invalidCount++;
      } else {
        console.log(`❌ ${name}: FEHLER BEIM VALIDIEREN`);
        console.log(`   Price ID: ${id}`);
        console.log(`   Fehler: ${error.message}`);
        console.log(`   Code: ${error.code || "N/A"}\n`);
        invalidCount++;
      }
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 ZUSAMMENFASSUNG:");
  console.log(`   ✅ Gültig: ${validCount}`);
  console.log(`   ❌ Ungültig/Fehlend: ${invalidCount + missingCount}`);
  console.log(`   📝 Nicht gesetzt: ${missingCount}`);
  console.log("=".repeat(60));

  if (invalidCount + missingCount > 0) {
    console.log("\n💡 TIPPS:");
    console.log("   - Führen Sie aus: node scripts/get-stripe-price-ids.js");
    console.log(
      "   - Dies zeigt alle verfügbaren Price IDs in Ihrem Stripe Account",
    );
    console.log("   - Aktualisieren Sie dann Ihre .env.local Datei\n");
  }
}

validatePrices();
