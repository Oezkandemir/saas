-- This migration ensures that the users table has the correct structure
-- and fixes any potential issues with the table

-- First, let's ensure the user_role type exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('ADMIN', 'USER');
    END IF;
END$$;

-- Check if users table exists and create it if not
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  "emailVerified" TIMESTAMP WITH TIME ZONE,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  role user_role DEFAULT 'USER'::user_role,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  stripe_current_period_end TIMESTAMP WITH TIME ZONE,
  avatar_url TEXT,
  status TEXT DEFAULT 'active'
);

-- Ensure indices exist
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users (email);

-- Make sure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Clear and recreate RLS policies
DROP POLICY IF EXISTS users_select_policy ON public.users;
CREATE POLICY users_select_policy ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS users_update_policy ON public.users;
CREATE POLICY users_update_policy ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Add policy for admins if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND policyname = 'Admins can view all users'
    ) THEN
        EXECUTE $policy$
        CREATE POLICY "Admins can view all users" 
          ON public.users FOR SELECT 
          USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'ADMIN');
        $policy$;
    END IF;
END$$;

-- Update the handle_new_user function to handle new signups correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    name, 
    role,
    created_at,
    updated_at,
    avatar_url
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role, 
      'USER'::user_role
    ),
    NOW(),
    NOW(),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE 
  SET 
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Try to fix any existing users without records in the users table
INSERT INTO public.users (id, email, name, role, created_at, updated_at)
SELECT 
  auth.id, 
  auth.email, 
  COALESCE(auth.raw_user_meta_data->>'name', split_part(auth.email, '@', 1)), 
  'USER'::user_role,
  NOW(),
  NOW()
FROM auth.users auth
LEFT JOIN public.users users ON auth.id = users.id
WHERE users.id IS NULL
ON CONFLICT (id) DO NOTHING; 