-- Fix subscription_plan enum to replace 'starter' with 'enterprise'
-- This migration ensures consistency with the codebase which expects: free, pro, enterprise

-- Step 1: Convert the enum column to text temporarily
ALTER TABLE public.subscriptions 
  ALTER COLUMN plan TYPE TEXT;

-- Step 2: Update any subscriptions with 'starter' plan to 'enterprise'
UPDATE public.subscriptions
SET plan = 'enterprise'
WHERE plan = 'starter';

-- Step 3: Drop the old enum type
DROP TYPE IF EXISTS subscription_plan;

-- Step 4: Create the new enum type with correct values: free, pro, enterprise
CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'enterprise');

-- Step 5: Convert the column back to the new enum type
ALTER TABLE public.subscriptions 
  ALTER COLUMN plan TYPE subscription_plan 
  USING plan::subscription_plan;

-- Step 6: Remove 'starter' plan from plans table
DELETE FROM public.plans WHERE plan_key = 'starter';

-- Step 7: Ensure 'enterprise' plan exists in plans table (monthly, if it doesn't already exist)
INSERT INTO public.plans (name, description, price, currency, interval, plan_key, is_active, features)
SELECT 
  'Enterprise', 
  'For large enterprises', 
  20.00, 
  'USD', 
  'month', 
  'enterprise', 
  true, 
  '["All pro features", "Priority support", "API access", "Custom integrations"]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.plans WHERE plan_key = 'enterprise' AND interval = 'month'
);

-- Step 8: Ensure 'enterprise' plan exists (yearly, if it doesn't already exist)
INSERT INTO public.plans (name, description, price, currency, interval, plan_key, is_active, features)
SELECT 
  'Enterprise', 
  'For large enterprises', 
  200.00, 
  'USD', 
  'year', 
  'enterprise', 
  true, 
  '["All pro features", "Priority support", "API access", "Custom integrations"]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.plans WHERE plan_key = 'enterprise' AND interval = 'year'
);
