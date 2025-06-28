-- Function to handle email verification and send welcome email
CREATE OR REPLACE FUNCTION public.handle_email_verification()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
BEGIN
  -- Check if the user is being verified (email confirmation)
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    -- Get user details
    SELECT email, raw_user_meta_data->>'name' 
    INTO user_email, user_name
    FROM auth.users 
    WHERE id = NEW.id;

    -- Call the edge function to send welcome email
    PERFORM
      net.http_post(
        url := CONCAT(COALESCE(current_setting('supabase_functions_endpoint', true), 'https://eboaupdriwdsixnmslxz.supabase.co'), '/functions/v1/send-email'),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', CONCAT('Bearer ', COALESCE(current_setting('supabase_functions_key', true), ''))
        ),
        body := jsonb_build_object(
          'type', 'welcome',
          'email', user_email,
          'name', user_name
        )::text
      );

    -- Update the emailVerified field in public.users table
    UPDATE public.users
    SET "emailVerified" = NEW.email_confirmed_at
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for email verification
DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users;
CREATE TRIGGER on_auth_user_email_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_email_verification();

-- Grant required permissions for the HTTP request
GRANT USAGE ON SCHEMA net TO postgres, service_role, anon, authenticated; 