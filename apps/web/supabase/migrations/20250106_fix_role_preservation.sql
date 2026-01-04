-- Fix role preservation issue
-- This migration ensures that admin roles are never overwritten by triggers or sync functions

-- Fix the handle_new_user function to preserve existing roles on conflict
-- CRITICAL: When a user already exists, we must NEVER update their role
-- Only admins should be able to change roles, not automatic triggers
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
    updated_at = NOW(),
    -- CRITICAL: Preserve the existing role - do NOT update it
    -- Only update name and avatar_url if they're provided and different
    name = COALESCE(
      NULLIF(EXCLUDED.name, ''),
      public.users.name
    ),
    avatar_url = COALESCE(
      EXCLUDED.avatar_url,
      public.users.avatar_url
    );
  -- Role is explicitly NOT updated to preserve admin roles
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a comment to document this critical behavior
COMMENT ON FUNCTION public.handle_new_user() IS 
'Creates a new user record when a user signs up. On conflict (user already exists), 
preserves the existing role to prevent admin roles from being reset. Only admins 
can change roles through the admin interface, not through automatic triggers.';










