# Setting Up Supabase Database for Stripe Integration

This guide will walk you through the necessary SQL queries to run in your Supabase database to enable Stripe subscription functionality.

## Prerequisites

- Supabase project created
- Stripe account with API keys

## Step 1: Create Users Table

Run the following SQL query in the Supabase SQL Editor:

```sql
-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email TEXT,
  name TEXT,
  role TEXT DEFAULT 'USER',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  stripe_current_period_end TIMESTAMPTZ
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users (email);
```

## Step 2: Set Up Row-Level Security Policies

```sql
-- Enable RLS on the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own data only
DROP POLICY IF EXISTS users_select_policy ON public.users;
CREATE POLICY users_select_policy ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Policy to allow users to update their own data
DROP POLICY IF EXISTS users_update_policy ON public.users;
CREATE POLICY users_update_policy ON public.users
  FOR UPDATE USING (auth.uid() = id);
```

## Step 3: Create User Sync Trigger

```sql
-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'USER')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user record when auth.users record is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Step 4: Create Helper Functions for Stripe Integration

```sql
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

-- Function to describe a table (used by the webhook handler)
CREATE OR REPLACE FUNCTION public.describe_table(table_name TEXT)
RETURNS TABLE (column_name TEXT, data_type TEXT) AS $$
BEGIN
  RETURN QUERY EXECUTE format('
    SELECT column_name::TEXT, data_type::TEXT
    FROM information_schema.columns
    WHERE table_schema = ''public''
    AND table_name = %L', table_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function needed for the webhook handler
CREATE OR REPLACE FUNCTION public.execute_sql(sql TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Step 5: Create Function to Sync Existing Auth Users

```sql
-- Create function to synchronize existing auth users
CREATE OR REPLACE FUNCTION public.sync_all_auth_users()
RETURNS INTEGER AS $$
DECLARE
  auth_user RECORD;
  counter INTEGER := 0;
BEGIN
  FOR auth_user IN
    SELECT id, email, raw_user_meta_data FROM auth.users
  LOOP
    INSERT INTO public.users (
      id,
      email,
      name,
      role,
      created_at,
      updated_at
    ) VALUES (
      auth_user.id,
      auth_user.email,
      COALESCE(auth_user.raw_user_meta_data->>'name', split_part(auth_user.email, '@', 1)),
      COALESCE(auth_user.raw_user_meta_data->>'role', 'USER'),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    IF FOUND THEN
      counter := counter + 1;
    END IF;
  END LOOP;

  RETURN counter;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Step 6: Running the Migration for the First Time

After setting up these functions, run the following SQL to sync all existing auth users:

```sql
-- Run this to sync all existing auth users to the users table
SELECT sync_all_auth_users();
```

## Environment Variables

Make sure you have the following environment variables set in your application:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret

# Stripe
STRIPE_API_KEY=your-stripe-api-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID=your-stripe-monthly-plan-id
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID=your-stripe-yearly-plan-id
NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID=your-stripe-business-monthly-plan-id
NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID=your-stripe-business-yearly-plan-id
```

## Troubleshooting

If you encounter issues with the Stripe integration, check:

1. The users table exists and has the correct schema
2. The RLS policies are properly configured
3. The trigger is correctly set up for new user creation
4. Your webhook endpoint is correct and receiving events
5. The Stripe API keys and webhook secret are correctly set in your environment variables
