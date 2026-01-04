/**
 * Interactive Stripe Account Info Script
 * Usage: node scripts/get-stripe-info-interactive.js
 * 
 * Enter your Stripe API Key when prompted to get account info and Price IDs
 */

const readline = require('readline');
const stripe = require('stripe');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function getStripeInfo() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 Stripe Account Information Tool');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const apiKey = await askQuestion('Bitte geben Sie Ihren Stripe API Key ein (sk_test_... oder sk_live_...): ');
  
  if (!apiKey || !apiKey.startsWith('sk_')) {
    console.error('\n❌ Ungültiger API Key. Muss mit "sk_test_" oder "sk_live_" beginnen.\n');
    rl.close();
    return;
  }
  
  console.log('\n🔍 Verbinde mit Stripe Account...\n');
  
  try {
    const stripeClient = stripe(apiKey.trim());
    
    // Get account information
    const account = await stripeClient.accounts.retrieve();
    
    console.log('✅ Stripe Account gefunden!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Account E-Mail:', account.email || 'Nicht verfügbar');
    console.log('🏢 Account Name:', account.business_profile?.name || account.display_name || 'Nicht verfügbar');
    console.log('🌍 Land:', account.country || 'Nicht verfügbar');
    console.log('💳 Account Typ:', account.type || 'Nicht verfügbar');
    console.log('📊 Account Status:', account.details_submitted ? '✅ Verifiziert' : '⚠️  Nicht verifiziert');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Get products
    console.log('📦 Produkte und Price IDs:\n');
    const products = await stripeClient.products.list({ limit: 100 });
    
    if (products.data.length === 0) {
      console.log('   ⚠️  Keine Produkte gefunden.');
      console.log('   Erstellen Sie Produkte in Stripe Dashboard.\n');
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
          console.log('      ⚠️  Keine Preise für dieses Produkt!\n');
        } else {
          console.log('      💰 Preise:');
          for (const price of prices.data) {
            const amount = (price.unit_amount / 100).toFixed(2);
            const currency = price.currency.toUpperCase();
            const interval = price.recurring?.interval || 'one-time';
            const intervalCount = price.recurring?.interval_count || 1;
            
            const priceLabel = interval === 'one-time' 
              ? `${currency} ${amount} (einmalig)`
              : `${currency} ${amount} / ${intervalCount} ${interval}`;
            
            console.log(`         - ${priceLabel}`);
            console.log(`           ✅ Price ID: ${price.id}`);
            
            // Suggest which env variable to use
            if (product.name.toLowerCase().includes('pro') && interval === 'month') {
              console.log(`           📝 → NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID`);
            } else if (product.name.toLowerCase().includes('pro') && interval === 'year') {
              console.log(`           📝 → NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID`);
            } else if ((product.name.toLowerCase().includes('enterprise') || product.name.toLowerCase().includes('business')) && interval === 'month') {
              console.log(`           📝 → NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID`);
            } else if ((product.name.toLowerCase().includes('enterprise') || product.name.toLowerCase().includes('business')) && interval === 'year') {
              console.log(`           📝 → NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID`);
            }
          }
          console.log('');
        }
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Nächste Schritte:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('1. Kopieren Sie die Price IDs oben');
    console.log('2. Öffnen Sie: apps/web/.env.local');
    console.log('3. Fügen Sie diese Zeilen hinzu:\n');
    console.log('   # Stripe API Key (falls noch nicht vorhanden)');
    console.log('   STRIPE_API_KEY=' + apiKey.substring(0, 20) + '...');
    console.log('');
    console.log('   # Pro Plan Price IDs');
    console.log('   NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID=price_xxxxx');
    console.log('   NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID=price_xxxxx');
    console.log('');
    console.log('   # Enterprise Plan Price IDs');
    console.log('   NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID=price_xxxxx');
    console.log('   NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID=price_xxxxx');
    console.log('\n4. Starten Sie den Server neu: pnpm dev\n');
    
  } catch (error) {
    console.error('\n❌ Fehler:', error.message);
    
    if (error.message.includes('Invalid API Key') || error.type === 'StripeAuthenticationError') {
      console.error('\n   ⚠️  Ungültige Stripe API Key');
      console.error('   Überprüfen Sie, ob Sie den richtigen Key verwenden');
      console.error('   Test Keys beginnen mit: sk_test_...');
      console.error('   Live Keys beginnen mit: sk_live_...');
    } else {
      console.error('\n   Details:', error.message);
    }
  }
  
  rl.close();
}

getStripeInfo();
















