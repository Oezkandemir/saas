-- Add default tax rate and payment days to company profiles
-- These values will be used as defaults when creating documents

-- Add default_tax_rate column (percentage, e.g., 19 for 19%)
ALTER TABLE public.company_profiles
  ADD COLUMN IF NOT EXISTS default_tax_rate NUMERIC(5,2) DEFAULT 19.00 CHECK (default_tax_rate >= 0 AND default_tax_rate <= 100);

-- Add default_payment_days column (number of days until payment is due)
ALTER TABLE public.company_profiles
  ADD COLUMN IF NOT EXISTS default_payment_days INTEGER DEFAULT 14 CHECK (default_payment_days >= 0);

-- Add payment_on_receipt column (boolean - true if payment is due on receipt)
ALTER TABLE public.company_profiles
  ADD COLUMN IF NOT EXISTS payment_on_receipt BOOLEAN DEFAULT false;

-- Update existing profiles to have default values if they don't have them
UPDATE public.company_profiles
SET default_tax_rate = 19.00
WHERE default_tax_rate IS NULL;

UPDATE public.company_profiles
SET default_payment_days = 14
WHERE default_payment_days IS NULL;

UPDATE public.company_profiles
SET payment_on_receipt = false
WHERE payment_on_receipt IS NULL;

