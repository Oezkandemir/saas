-- Add Polar Product ID columns to plans table
-- This migration adds Polar Product IDs to match subscriptions

DO $$ 
BEGIN
  -- Add polar_product_id_monthly if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'plans' 
    AND column_name = 'polar_product_id_monthly'
  ) THEN
    ALTER TABLE public.plans ADD COLUMN polar_product_id_monthly TEXT;
  END IF;

  -- Add polar_product_id_yearly if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'plans' 
    AND column_name = 'polar_product_id_yearly'
  ) THEN
    ALTER TABLE public.plans ADD COLUMN polar_product_id_yearly TEXT;
  END IF;
END $$;

-- Update plans with Polar Product IDs from config/subscriptions.ts
UPDATE public.plans
SET polar_product_id_monthly = '77c6e131-56bc-46cf-8c5b-d8e6814a356b',
    polar_product_id_yearly = '8bc98233-3a2c-46e5-ae90-c71ac7b4e22f'
WHERE plan_key = 'pro';

UPDATE public.plans
SET polar_product_id_monthly = '2a37d4e2-e513-4c3b-b463-9c79372a0e4f',
    polar_product_id_yearly = 'd05fc952-3c93-43cf-a8ac-9c2fea507e6c'
WHERE plan_key = 'enterprise';

-- Add comment for documentation
COMMENT ON COLUMN public.plans.polar_product_id_monthly IS 'Polar.sh Product ID for monthly subscription';
COMMENT ON COLUMN public.plans.polar_product_id_yearly IS 'Polar.sh Product ID for yearly subscription';

