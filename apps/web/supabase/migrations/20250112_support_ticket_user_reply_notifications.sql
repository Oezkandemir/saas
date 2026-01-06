-- Support Ticket User Reply Notifications Migration
-- Notifies admins when a user replies to a support ticket

-- Function to notify admins when a user replies to a ticket
CREATE OR REPLACE FUNCTION public.notify_admins_user_reply()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_record RECORD;
  v_ticket_record RECORD;
  v_user_name TEXT;
  v_user_email TEXT;
  v_message_preview TEXT;
BEGIN
  -- Only notify if the message is from a user (not admin)
  IF NEW.is_admin = false THEN
    -- Get ticket information
    SELECT user_id, subject INTO v_ticket_record
    FROM public.support_tickets
    WHERE id = NEW.ticket_id;

    -- Get user information for the message sender
    SELECT name, email INTO v_user_name, v_user_email
    FROM public.users
    WHERE id = NEW.user_id;

    -- If user name is not available, use email
    IF v_user_name IS NULL OR v_user_name = '' THEN
      v_user_name := COALESCE(v_user_email, 'A user');
    END IF;

    -- Create a preview of the message (first 100 characters)
    v_message_preview := LEFT(NEW.message, 100);
    IF LENGTH(NEW.message) > 100 THEN
      v_message_preview := v_message_preview || '...';
    END IF;

    -- Loop through all admin users and create notifications
    FOR v_admin_record IN
      SELECT id FROM public.users WHERE role = 'ADMIN'
    LOOP
      -- Create notification for each admin
      PERFORM public._create_notification_internal(
        p_user_id := v_admin_record.id,
        p_title := 'New Reply to Support Ticket',
        p_content := v_user_name || ' replied to ticket "' || v_ticket_record.subject || '": ' || v_message_preview,
        p_type := 'SUPPORT'::notification_type,
        p_action_url := '/admin/support/' || NEW.ticket_id,
        p_metadata := jsonb_build_object(
          'ticket_id', NEW.ticket_id,
          'ticket_subject', v_ticket_record.subject,
          'message_id', NEW.id,
          'user_id', NEW.user_id,
          'user_name', v_user_name,
          'user_email', v_user_email,
          'message_preview', v_message_preview,
          'is_user_reply', true
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to notify admins when a user replies
DROP TRIGGER IF EXISTS notify_admins_on_user_reply ON public.support_ticket_messages;
CREATE TRIGGER notify_admins_on_user_reply
  AFTER INSERT ON public.support_ticket_messages
  FOR EACH ROW
  WHEN (NEW.is_admin = false)
  EXECUTE FUNCTION public.notify_admins_user_reply();

-- Add comment for documentation
COMMENT ON FUNCTION public.notify_admins_user_reply IS 'Automatically notifies all admin users when a user replies to a support ticket';

