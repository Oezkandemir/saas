/**
 * Check Stripe Account Information
 * Shows the email and account details associated with your Stripe API key
 */

// Try to load from both .env.local and .env
require('dotenv').config({ path: '.env.local' });
if (!process.env.STRIPE_API_KEY) {
  require('dotenv').config({ path: '.env' });
}

const stripe = require('stripe')(process.env.STRIPE_API_KEY);

async function checkStripeAccount() {
  try {
    if (!process.env.STRIPE_API_KEY) {
      console.error('❌ STRIPE_API_KEY nicht gefunden in .env.local');
      console.log('\nBitte setzen Sie STRIPE_API_KEY in apps/web/.env.local');
      return;
    }

    console.log('🔍 Verbinde mit Stripe Account...\n');

    // Get account information
    const account = await stripe.accounts.retrieve();
    
    console.log('✅ Stripe Account gefunden!\n');
    console.log('📧 Account E-Mail:', account.email || 'Nicht verfügbar');
    console.log('🏢 Account Name:', account.business_profile?.name || 'Nicht verfügbar');
    console.log('🌍 Land:', account.country || 'Nicht verfügbar');
    console.log('💳 Account Typ:', account.type || 'Nicht verfügbar');
    console.log('📊 Account Status:', account.details_submitted ? '✅ Verifiziert' : '⚠️  Nicht verifiziert');
    
    // Get products
    console.log('\n📦 Produkte in Ihrem Account:\n');
    const products = await stripe.products.list({ limit: 100 });
    
    if (products.data.length === 0) {
      console.log('   Keine Produkte gefunden.');
      console.log('   Erstellen Sie Produkte in Stripe Dashboard.\n');
    } else {
      for (const product of products.data) {
        console.log(`   📦 ${product.name} (${product.id})`);
        
        // Get prices for this product
        const prices = await stripe.prices.list({
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
            
            console.log(`         - ${currency} ${amount} / ${intervalCount} ${interval}`);
            console.log(`           ✅ Price ID: ${price.id}`);
          }
          console.log('');
        }
      }
    }
    
    console.log('\n📝 Nächste Schritte:');
    console.log('   1. Kopieren Sie die Price IDs oben');
    console.log('   2. Fügen Sie sie in apps/web/.env.local ein:');
    console.log('      NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID=price_xxxxx');
    console.log('      NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID=price_xxxxx');
    console.log('      NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID=price_xxxxx');
    console.log('      NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID=price_xxxxx');
    console.log('   3. Starten Sie den Server neu\n');
    
  } catch (error) {
    console.error('\n❌ Fehler:', error.message);
    
    if (error.message.includes('No API key')) {
      console.error('\n   STRIPE_API_KEY nicht gefunden in .env.local');
    } else if (error.message.includes('Invalid API Key')) {
      console.error('\n   Ungültige Stripe API Key');
      console.error('   Überprüfen Sie, ob Sie den richtigen Key verwenden (sk_test_... für Test, sk_live_... für Production)');
    } else if (error.type === 'StripeAuthenticationError') {
      console.error('\n   Authentifizierungsfehler');
      console.error('   Überprüfen Sie Ihre STRIPE_API_KEY');
    } else {
      console.error('\n   Unerwarteter Fehler:', error);
    }
  }
}

checkStripeAccount();

