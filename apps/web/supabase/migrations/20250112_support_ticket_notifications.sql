-- Support Ticket Real-time Notifications Migration
-- Creates functions and triggers to automatically notify admins when tickets are created
-- and notify users when admins reply to tickets

-- Internal function to create notifications (used by triggers, bypasses auth checks)
-- Uses the existing notification_type enum
CREATE OR REPLACE FUNCTION public._create_notification_internal(
  p_user_id UUID,
  p_title TEXT,
  p_content TEXT,
  p_type notification_type,
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- SECURITY: Validate input
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid input: p_user_id cannot be null';
  END IF;

  IF p_title IS NULL OR p_title = '' THEN
    RAISE EXCEPTION 'Invalid input: p_title cannot be null or empty';
  END IF;

  IF p_content IS NULL OR p_content = '' THEN
    RAISE EXCEPTION 'Invalid input: p_content cannot be null or empty';
  END IF;

  IF p_type IS NULL THEN
    RAISE EXCEPTION 'Invalid input: p_type cannot be null';
  END IF;

  -- SECURITY: Validate user exists
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Insert notification
  INSERT INTO public.user_notifications (
    user_id,
    title,
    content,
    type,
    action_url,
    metadata,
    read,
    created_at
  )
  VALUES (
    p_user_id,
    p_title,
    p_content,
    p_type,
    p_action_url,
    COALESCE(p_metadata, '{}'::jsonb),
    false,
    NOW()
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify all admins when a new support ticket is created
CREATE OR REPLACE FUNCTION public.notify_admins_new_ticket()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_record RECORD;
  v_user_name TEXT;
  v_user_email TEXT;
BEGIN
  -- Get user information for the ticket creator
  SELECT name, email INTO v_user_name, v_user_email
  FROM public.users
  WHERE id = NEW.user_id;

  -- If user name is not available, use email
  IF v_user_name IS NULL OR v_user_name = '' THEN
    v_user_name := COALESCE(v_user_email, 'A user');
  END IF;

  -- Loop through all admin users and create notifications
  FOR v_admin_record IN
    SELECT id FROM public.users WHERE role = 'ADMIN'
  LOOP
    -- Skip notification for the ticket creator if they happen to be an admin
    IF v_admin_record.id != NEW.user_id THEN
      PERFORM public._create_notification_internal(
        p_user_id := v_admin_record.id,
        p_title := 'New Support Ticket Created',
        p_content := v_user_name || ' created a new support ticket: "' || NEW.subject || '"',
        p_type := 'SUPPORT'::notification_type,
        p_action_url := '/admin/support/' || NEW.id,
        p_metadata := jsonb_build_object(
          'ticket_id', NEW.id,
          'ticket_subject', NEW.subject,
          'ticket_priority', NEW.priority,
          'ticket_status', NEW.status,
          'user_id', NEW.user_id,
          'user_name', v_user_name,
          'user_email', v_user_email
        )
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify ticket owner when an admin replies
CREATE OR REPLACE FUNCTION public.notify_user_admin_reply()
RETURNS TRIGGER AS $$
DECLARE
  v_ticket_record RECORD;
  v_admin_name TEXT;
  v_admin_email TEXT;
  v_message_preview TEXT;
BEGIN
  -- Get ticket information
  SELECT user_id, subject INTO v_ticket_record
  FROM public.support_tickets
  WHERE id = NEW.ticket_id;

  -- Only notify if the message is from an admin
  IF NEW.is_admin = true THEN
    -- Get admin information
    SELECT name, email INTO v_admin_name, v_admin_email
    FROM public.users
    WHERE id = NEW.user_id;

    -- If admin name is not available, use email or default
    IF v_admin_name IS NULL OR v_admin_name = '' THEN
      v_admin_name := COALESCE(v_admin_email, 'Support Team');
    END IF;

    -- Create a preview of the message (first 100 characters)
    v_message_preview := LEFT(NEW.message, 100);
    IF LENGTH(NEW.message) > 100 THEN
      v_message_preview := v_message_preview || '...';
    END IF;

    -- Create notification for the ticket owner
    PERFORM public._create_notification_internal(
      p_user_id := v_ticket_record.user_id,
      p_title := 'New Reply to Your Support Ticket',
      p_content := v_admin_name || ' replied to your ticket "' || v_ticket_record.subject || '": ' || v_message_preview,
      p_type := 'SUPPORT'::notification_type,
      p_action_url := '/dashboard/support/' || NEW.ticket_id,
      p_metadata := jsonb_build_object(
        'ticket_id', NEW.ticket_id,
        'ticket_subject', v_ticket_record.subject,
        'message_id', NEW.id,
        'admin_id', NEW.user_id,
        'admin_name', v_admin_name,
        'admin_email', v_admin_email,
        'message_preview', v_message_preview
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
-- Trigger to notify admins when a new ticket is created
DROP TRIGGER IF EXISTS notify_admins_on_ticket_create ON public.support_tickets;
CREATE TRIGGER notify_admins_on_ticket_create
  AFTER INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_ticket();

-- Trigger to notify user when an admin replies
DROP TRIGGER IF EXISTS notify_user_on_admin_reply ON public.support_ticket_messages;
CREATE TRIGGER notify_user_on_admin_reply
  AFTER INSERT ON public.support_ticket_messages
  FOR EACH ROW
  WHEN (NEW.is_admin = true)
  EXECUTE FUNCTION public.notify_user_admin_reply();

-- Enable Realtime for user_notifications table (if not already enabled)
DO $$
BEGIN
  -- Try to add user_notifications to realtime publication (will fail silently if already added)
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- Add comments for documentation
COMMENT ON FUNCTION public.notify_admins_new_ticket IS 'Automatically notifies all admin users when a new support ticket is created';
COMMENT ON FUNCTION public.notify_user_admin_reply IS 'Automatically notifies the ticket owner when an admin replies to their ticket';
COMMENT ON FUNCTION public._create_notification_internal IS 'Internal function to create notifications without auth checks. Used by triggers.';

