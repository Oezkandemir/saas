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

-- Create RLS policies for the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own data only
DROP POLICY IF EXISTS users_select_policy ON public.users;
CREATE POLICY users_select_policy ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Policy to allow users to update their own data
DROP POLICY IF EXISTS users_update_policy ON public.users;
CREATE POLICY users_update_policy ON public.users
  FOR UPDATE USING (auth.uid() = id);

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

-- Create describe_table function for checking table existence
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