-- Fix handle_new_user function to handle email conflicts
-- This prevents "duplicate key value violates unique constraint users_email_key" errors
-- when a user tries to sign up with an email that already exists

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_existing_user_id UUID;
  v_existing_role TEXT;
BEGIN
  -- SECURITY: Validate input
  IF NEW.id IS NULL THEN
    RAISE EXCEPTION 'Invalid input: user id cannot be null';
  END IF;

  -- Check if user already exists by ID
  SELECT role INTO v_existing_role
  FROM public.users
  WHERE id = NEW.id;

  -- Also check if email already exists (different user)
  SELECT id INTO v_existing_user_id
  FROM public.users
  WHERE email = NEW.email AND id != NEW.id;

  IF v_existing_role IS NOT NULL THEN
    -- User already exists with same ID - update email and timestamp
    UPDATE public.users
    SET 
      email = NEW.email,
      updated_at = NOW(),
      name = COALESCE(
        NULLIF(NEW.raw_user_meta_data->>'name', ''),
        public.users.name
      ),
      avatar_url = COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        public.users.avatar_url
      )
    WHERE id = NEW.id;
    
    RETURN NEW;
  ELSIF v_existing_user_id IS NOT NULL THEN
    -- Email already exists with different ID
    -- This shouldn't happen if our duplicate check works, but handle it gracefully
    -- Log warning and skip insert to prevent constraint violation
    RAISE WARNING 'User with email % already exists (ID: %). Skipping insert for new user ID: %', 
      NEW.email, v_existing_user_id, NEW.id;
    
    -- Don't insert - let the application handle the error
    RETURN NEW;
  ELSE
    -- New user - create with default USER role
    -- Use exception handling to catch email conflicts
    BEGIN
      INSERT INTO public.users (id, email, name, role, created_at, updated_at, avatar_url)
      VALUES (
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
        name = COALESCE(
          NULLIF(EXCLUDED.name, ''),
          public.users.name
        ),
        avatar_url = COALESCE(
          EXCLUDED.avatar_url,
          public.users.avatar_url
        );
    EXCEPTION
      WHEN unique_violation THEN
        -- Email conflict - user already exists with this email
        -- Skip silently to prevent error propagation
        RAISE WARNING 'User with email % already exists. Skipping insert.', NEW.email;
        RETURN NEW;
    END;
    
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Add comment
COMMENT ON FUNCTION public.handle_new_user() IS 
'Handle new user creation from auth trigger. Handles both ID and email conflicts gracefully. 
Preserves existing roles to prevent admin role reset.';

