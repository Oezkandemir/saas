-- Migration: Add Polar.sh subscription fields
-- This migration adds Polar.sh fields to support both Stripe and Polar subscriptions

-- Add Polar fields to users table
DO $$ 
BEGIN
  -- Add polar_customer_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'polar_customer_id'
  ) THEN
    ALTER TABLE public.users ADD COLUMN polar_customer_id TEXT;
  END IF;

  -- Add polar_subscription_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'polar_subscription_id'
  ) THEN
    ALTER TABLE public.users ADD COLUMN polar_subscription_id TEXT UNIQUE;
  END IF;

  -- Add polar_product_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'polar_product_id'
  ) THEN
    ALTER TABLE public.users ADD COLUMN polar_product_id TEXT;
  END IF;

  -- Add polar_current_period_end if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'polar_current_period_end'
  ) THEN
    ALTER TABLE public.users ADD COLUMN polar_current_period_end TIMESTAMPTZ;
  END IF;

  -- Add payment_provider to track which provider is used
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'payment_provider'
  ) THEN
    ALTER TABLE public.users ADD COLUMN payment_provider TEXT DEFAULT 'stripe';
  END IF;
END $$;

-- Add Polar fields to subscriptions table
DO $$ 
BEGIN
  -- Add polar_subscription_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'polar_subscription_id'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN polar_subscription_id TEXT UNIQUE;
  END IF;

  -- Add polar_customer_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'polar_customer_id'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN polar_customer_id TEXT;
  END IF;

  -- Add polar_product_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'polar_product_id'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN polar_product_id TEXT;
  END IF;

  -- Add payment_provider to subscriptions table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'payment_provider'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN payment_provider TEXT DEFAULT 'stripe';
  END IF;
END $$;

-- Create indexes for Polar fields
CREATE INDEX IF NOT EXISTS users_polar_subscription_id_idx ON public.users(polar_subscription_id);
CREATE INDEX IF NOT EXISTS users_polar_customer_id_idx ON public.users(polar_customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_polar_subscription_id_idx ON public.subscriptions(polar_subscription_id);
CREATE INDEX IF NOT EXISTS subscriptions_payment_provider_idx ON public.subscriptions(payment_provider);









