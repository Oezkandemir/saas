/**
 * Helper script to get Price IDs from Stripe Products
 * 
 * Usage:
 * 1. Set STRIPE_API_KEY in your .env.local
 * 2. Run: node scripts/get-stripe-price-ids.js
 * 
 * This will list all your products and their associated price IDs
 */

require('dotenv').config({ path: '.env.local' });

const stripe = require('stripe')(process.env.STRIPE_API_KEY);

async function getPriceIds() {
  try {
    console.log('🔍 Fetching products from Stripe...\n');
    
    const products = await stripe.products.list({ limit: 100 });
    
    if (products.data.length === 0) {
      console.log('❌ No products found in your Stripe account.');
      console.log('   Please create products first in Stripe Dashboard.\n');
      return;
    }
    
    console.log(`✅ Found ${products.data.length} product(s):\n`);
    
    for (const product of products.data) {
      console.log(`📦 Product: ${product.name} (${product.id})`);
      console.log(`   Description: ${product.description || 'N/A'}`);
      
      // Get prices for this product
      const prices = await stripe.prices.list({
        product: product.id,
        limit: 100,
      });
      
      if (prices.data.length === 0) {
        console.log('   ⚠️  No prices found for this product!\n');
        continue;
      }
      
      console.log('   💰 Prices:');
      for (const price of prices.data) {
        const amount = (price.unit_amount / 100).toFixed(2);
        const currency = price.currency.toUpperCase();
        const interval = price.recurring?.interval || 'one-time';
        const intervalCount = price.recurring?.interval_count || 1;
        
        console.log(`      - ${currency} ${amount} / ${intervalCount} ${interval}`);
        console.log(`        Price ID: ${price.id}`);
        console.log(`        ✅ Use this ID in your .env.local\n`);
      }
    }
    
    console.log('\n📝 Copy the Price IDs above and add them to your .env.local:');
    console.log('   NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID=price_xxxxx');
    console.log('   NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID=price_xxxxx');
    console.log('   NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID=price_xxxxx');
    console.log('   NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID=price_xxxxx\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('No API key')) {
      console.error('\n   Please set STRIPE_API_KEY in your .env.local file');
    }
  }
}

getPriceIds();















