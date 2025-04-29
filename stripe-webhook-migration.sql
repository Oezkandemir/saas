-- Create functions to help with Stripe webhook handling

-- Function to handle user creation in Stripe
CREATE OR REPLACE FUNCTION public.handle_stripe_customer_created(
  user_id UUID,
  customer_id TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.users
  SET stripe_customer_id = customer_id,
      updated_at = NOW()
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle subscription updates
CREATE OR REPLACE FUNCTION public.handle_stripe_subscription_updated(
  user_id UUID,
  subscription_id TEXT,
  price_id TEXT,
  current_period_end TIMESTAMPTZ
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.users
  SET stripe_subscription_id = subscription_id,
      stripe_price_id = price_id,
      stripe_current_period_end = current_period_end,
      updated_at = NOW()
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle subscription cancellations
CREATE OR REPLACE FUNCTION public.handle_stripe_subscription_cancelled(
  user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.users
  SET stripe_subscription_id = NULL,
      stripe_price_id = NULL,
      updated_at = NOW()
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user ID by stripe customer ID
CREATE OR REPLACE FUNCTION public.get_user_id_by_stripe_customer(
  customer_id TEXT
)
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id
  FROM public.users
  WHERE stripe_customer_id = customer_id;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 