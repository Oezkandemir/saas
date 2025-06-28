-- Create User Profile Table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  twitter_handle TEXT,
  github_handle TEXT,
  linkedin_url TEXT,
  profile_picture_url TEXT,
  cover_photo_url TEXT,
  theme_preference TEXT DEFAULT 'system',
  language_preference TEXT DEFAULT 'en',
  notification_preferences JSONB DEFAULT '{"email": true, "push": true, "marketing": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create User Activity Log Table
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- e.g., 'login', 'password_change', 'email_change', 'support_ticket', etc.
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create User Notifications Table
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL, -- e.g., 'system', 'billing', 'support', etc.
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS Policies for user_profiles

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'ADMIN'
  ));

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create RLS Policies for user_activity_logs

-- Allow users to view their own activity logs
CREATE POLICY "Users can view their own activity logs"
  ON public.user_activity_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'ADMIN'
  ));

-- Create RLS Policies for user_notifications

-- Allow users to view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.user_notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow users to update their own notifications (e.g., mark as read)
CREATE POLICY "Users can update their own notifications"
  ON public.user_notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Enable RLS on tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function for user_profiles
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS user_activity_logs_user_id_idx ON public.user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS user_activity_logs_activity_type_idx ON public.user_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS user_notifications_user_id_idx ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS user_notifications_read_idx ON public.user_notifications(read);

-- Function to create default profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  
  -- Log signup activity
  INSERT INTO public.user_activity_logs (user_id, activity_type, details)
  VALUES (NEW.id, 'signup', json_build_object('method', NEW.app_metadata->>'provider'));
  
  -- Welcome notification
  INSERT INTO public.user_notifications (user_id, title, content, type, action_url)
  VALUES (
    NEW.id, 
    'Welcome to our platform!', 
    'Thanks for joining. Explore our features and get started with your account.', 
    'system',
    '/dashboard'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user(); 