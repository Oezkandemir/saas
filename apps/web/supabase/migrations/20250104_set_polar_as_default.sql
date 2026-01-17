-- Migration: Set Polar as default payment provider
-- This migration updates the default payment provider from Stripe to Polar

-- Update payment_provider default value for users table
DO $$ 
BEGIN
  -- Change default value for new users
  ALTER TABLE public.users ALTER COLUMN payment_provider SET DEFAULT 'polar';
  
  -- Update existing users without a payment_provider to 'polar'
  UPDATE public.users 
  SET payment_provider = 'polar' 
  WHERE payment_provider IS NULL OR payment_provider = 'stripe';
END $$;

-- Update payment_provider default value for subscriptions table
DO $$ 
BEGIN
  -- Change default value for new subscriptions
  ALTER TABLE public.subscriptions ALTER COLUMN payment_provider SET DEFAULT 'polar';
  
  -- Update existing subscriptions without a payment_provider to 'polar'
  UPDATE public.subscriptions 
  SET payment_provider = 'polar' 
  WHERE payment_provider IS NULL OR payment_provider = 'stripe';
END $$;

