# Stripe Setup Guide for Subscription Pricing

This guide will help you properly set up Stripe for subscriptions in this Next.js application.

## Issue: Invalid Price IDs

If you're seeing errors like `No such price: 'prod_SDmOew18jxLk0C'` when trying to check out, it means you're using product IDs (`prod_...`) instead of price IDs (`price_...`).

## Fixing the Issue

### 1. Create Products and Price IDs in Stripe

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com/)
2. Go to **Products** > **Add Product**
3. Create your product (e.g., "Pro Plan")
4. Under the **Pricing** section, add your pricing options:
   - For the monthly plan, set a recurring price (e.g., $15/month)
   - For the yearly plan, add another price option (e.g., $144/year)
5. Save the product

### 2. Copy the Price IDs (Not Product IDs)

After creating your product and pricing options:

1. Go back to the **Products** page
2. Click on your product
3. Under the **Pricing** section, you'll see your price options
4. For each price option, click the **...** (three dots) and select **Copy ID**
5. The copied ID should start with `price_` (NOT `prod_`)

### 3. Update Your Environment Variables

Create or edit your `.env.local` file to include:

```env
# Stripe Price IDs (must start with 'price_', not 'prod_')
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID=price_abc123...
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID=price_def456...
NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID=price_ghi789...
NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID=price_jkl012...

# Stripe API keys
STRIPE_API_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 4. Restart Your Development Server

After updating your environment variables, restart your development server:

```bash
npm run dev
```

## Testing Subscriptions

When testing subscriptions:

1. Use Stripe's [test card numbers](https://stripe.com/docs/testing#cards):

   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

2. Use any future expiration date, any 3-digit CVC, and any billing details

## Troubleshooting

If you continue to have issues:

1. Check the error message in the console logs
2. Verify your Stripe price IDs start with `price_`
3. Make sure your Stripe API key is valid and has the correct permissions
4. Check if your Stripe webhook is properly configured if testing webhooks

For more information, refer to the [Stripe API Documentation](https://stripe.com/docs/api).
