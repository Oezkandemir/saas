-- Create plans table for subscription plan management
-- This table stores subscription plans that can be managed in the admin dashboard

CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'USD',
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),
  features JSONB DEFAULT '[]'::jsonb,
  limits JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  plan_key TEXT UNIQUE, -- Optional: for referencing plans by key (e.g., 'free', 'starter', 'pro')
  stripe_price_id TEXT, -- Optional: Stripe price ID
  stripe_product_id TEXT, -- Optional: Stripe product ID
  polar_product_id_monthly TEXT, -- Optional: Polar.sh product ID for monthly
  polar_product_id_yearly TEXT, -- Optional: Polar.sh product ID for yearly
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS plans_is_active_idx ON public.plans(is_active);
CREATE INDEX IF NOT EXISTS plans_plan_key_idx ON public.plans(plan_key);
CREATE INDEX IF NOT EXISTS plans_price_idx ON public.plans(price);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Admins can view all plans
CREATE POLICY "Admins can view all plans" 
  ON public.plans FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Admins can insert plans
CREATE POLICY "Admins can insert plans" 
  ON public.plans FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Admins can update plans
CREATE POLICY "Admins can update plans" 
  ON public.plans FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Admins can delete plans
CREATE POLICY "Admins can delete plans" 
  ON public.plans FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_plans_updated_at ON public.plans;
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW
  EXECUTE FUNCTION update_plans_updated_at();

-- Insert some default plans if they don't exist
INSERT INTO public.plans (name, description, price, currency, interval, plan_key, is_active, features)
VALUES 
  ('Free', 'Basic plan with limited features', 0.00, 'USD', 'month', 'free', true, '["Basic features", "Limited support"]'::jsonb),
  ('Starter', 'Perfect for small businesses', 9.99, 'USD', 'month', 'starter', true, '["All basic features", "Email support", "5GB storage"]'::jsonb),
  ('Pro', 'For growing businesses', 29.99, 'USD', 'month', 'pro', true, '["All starter features", "Priority support", "50GB storage", "Advanced analytics"]'::jsonb)
ON CONFLICT (plan_key) DO NOTHING;
