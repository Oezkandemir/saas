-- Notifications Functions Migration
-- This migration adds the necessary RPC functions for notification management

-- Function to delete a specific notification (with security check)
CREATE OR REPLACE FUNCTION public.api_delete_notification(p_notification_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_exists BOOLEAN;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  
  -- Check if the notification exists and belongs to the current user
  SELECT EXISTS (
    SELECT 1 FROM public.user_notifications 
    WHERE id = p_notification_id AND user_id = v_user_id
  ) INTO v_exists;
  
  -- If the notification exists and belongs to the user, delete it
  IF v_exists THEN
    DELETE FROM public.user_notifications
    WHERE id = p_notification_id AND user_id = v_user_id;
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete all notifications for the current user
CREATE OR REPLACE FUNCTION public.api_delete_all_notifications()
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_count INTEGER;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  
  -- Delete all notifications for the current user
  DELETE FROM public.user_notifications
  WHERE user_id = v_user_id
  RETURNING count(*) INTO v_count;
  
  -- Return success
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_as_read(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_notifications
  SET read = true
  WHERE user_id = p_user_id AND read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 