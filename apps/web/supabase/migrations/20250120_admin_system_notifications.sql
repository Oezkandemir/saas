-- Admin System Notifications
-- Creates triggers and functions to notify admins of important system events

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.notify_all_admins(TEXT, TEXT, notification_type, TEXT, JSONB);

-- Function to notify all admins of a system event
CREATE OR REPLACE FUNCTION public.notify_all_admins(
  p_title TEXT,
  p_content TEXT,
  p_type notification_type DEFAULT 'SYSTEM',
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_admin_record RECORD;
BEGIN
  -- Loop through all admin users and create notifications
  FOR v_admin_record IN
    SELECT id FROM public.users WHERE role = 'ADMIN'
  LOOP
    -- Use the internal notification function to bypass RLS
    PERFORM public._create_notification_internal(
      p_user_id := v_admin_record.id,
      p_title := p_title,
      p_content := p_content,
      p_type := p_type,
      p_action_url := p_action_url,
      p_metadata := COALESCE(p_metadata, '{}'::jsonb)
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify admins when a new user registers
CREATE OR REPLACE FUNCTION public.notify_admins_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_name TEXT;
  v_user_email TEXT;
BEGIN
  -- Get user information
  v_user_name := COALESCE(NEW.name, NEW.email, 'A new user');
  v_user_email := NEW.email;

  -- Notify all admins
  PERFORM public.notify_all_admins(
    p_title := 'New User Registered',
    p_content := v_user_name || ' (' || v_user_email || ') has just registered',
    p_type := 'WELCOME'::notification_type,
    p_action_url := '/admin/users/' || NEW.id,
    p_metadata := jsonb_build_object(
      'user_id', NEW.id,
      'user_email', v_user_email,
      'user_name', v_user_name,
      'registration_date', NEW.created_at
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify admins when a system error occurs
CREATE OR REPLACE FUNCTION public.notify_admins_system_error()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify for critical errors
  IF NEW.error_type = 'critical' THEN
    PERFORM public.notify_all_admins(
      p_title := 'Critical System Error',
      p_content := 'A critical error occurred in ' || NEW.component || ': ' || LEFT(NEW.error_message, 200),
      p_type := 'SYSTEM'::notification_type,
      p_action_url := '/admin/system',
      p_metadata := jsonb_build_object(
        'error_id', NEW.id,
        'component', NEW.component,
        'error_type', NEW.error_type,
        'error_message', NEW.error_message,
        'created_at', NEW.created_at
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify admins when an inbound email is received
CREATE OR REPLACE FUNCTION public.notify_admins_inbound_email()
RETURNS TRIGGER AS $$
DECLARE
  v_from_email TEXT;
  v_subject TEXT;
BEGIN
  v_from_email := NEW.from_email;
  v_subject := COALESCE(NEW.subject, 'No subject');

  -- Notify all admins
  PERFORM public.notify_all_admins(
    p_title := 'New Inbound Email Received',
    p_content := 'Email from ' || v_from_email || ': ' || LEFT(v_subject, 100),
    p_type := 'SYSTEM'::notification_type,
    p_action_url := '/admin/emails/inbound/' || NEW.id,
    p_metadata := jsonb_build_object(
      'email_id', NEW.id,
      'from_email', v_from_email,
      'subject', v_subject,
      'received_at', NEW.created_at
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers (only if tables exist)
-- Trigger for new user registration
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    DROP TRIGGER IF EXISTS notify_admins_on_new_user ON public.users;
    CREATE TRIGGER notify_admins_on_new_user
      AFTER INSERT ON public.users
      FOR EACH ROW
      WHEN (NEW.role != 'ADMIN') -- Don't notify when admins are created
      EXECUTE FUNCTION public.notify_admins_new_user();
  END IF;
END $$;

-- Trigger for system errors
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_errors') THEN
    DROP TRIGGER IF EXISTS notify_admins_on_system_error ON public.system_errors;
    CREATE TRIGGER notify_admins_on_system_error
      AFTER INSERT ON public.system_errors
      FOR EACH ROW
      EXECUTE FUNCTION public.notify_admins_system_error();
  END IF;
END $$;

-- Trigger for inbound emails
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inbound_emails') THEN
    DROP TRIGGER IF EXISTS notify_admins_on_inbound_email ON public.inbound_emails;
    CREATE TRIGGER notify_admins_on_inbound_email
      AFTER INSERT ON public.inbound_emails
      FOR EACH ROW
      EXECUTE FUNCTION public.notify_admins_inbound_email();
  END IF;
END $$;

-- Comments
COMMENT ON FUNCTION public.notify_all_admins IS 'Notify all admin users of a system event';
COMMENT ON FUNCTION public.notify_admins_new_user IS 'Notify admins when a new user registers';
COMMENT ON FUNCTION public.notify_admins_system_error IS 'Notify admins of critical system errors';
COMMENT ON FUNCTION public.notify_admins_inbound_email IS 'Notify admins when an inbound email is received';
