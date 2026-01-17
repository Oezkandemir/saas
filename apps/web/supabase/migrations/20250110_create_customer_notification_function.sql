-- Create Customer Notification Function
-- This function creates notifications for customer-related actions (created, updated, deleted)

CREATE OR REPLACE FUNCTION public.create_customer_notification(
  p_user_id UUID,
  p_customer_id UUID, -- Can be NULL for deleted customers
  p_action TEXT,
  p_customer_name TEXT
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_title TEXT;
  v_content TEXT;
  v_action_url TEXT;
BEGIN
  -- SECURITY: Validate authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- SECURITY: Users can only create notifications for themselves
  IF p_user_id != auth.uid() THEN
    DECLARE
      v_current_user_role TEXT;
    BEGIN
      SELECT role INTO v_current_user_role
      FROM public.users
      WHERE id = auth.uid();
      
      IF v_current_user_role IS NULL OR v_current_user_role != 'ADMIN' THEN
        RAISE EXCEPTION 'Not authorized: Can only create notifications for own account';
      END IF;
    END;
  END IF;

  -- SECURITY: Validate input
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid input: p_user_id cannot be null';
  END IF;

  IF p_action IS NULL OR p_action NOT IN ('created', 'updated', 'deleted') THEN
    RAISE EXCEPTION 'Invalid input: p_action must be created, updated, or deleted';
  END IF;

  IF p_customer_name IS NULL OR p_customer_name = '' THEN
    RAISE EXCEPTION 'Invalid input: p_customer_name cannot be null or empty';
  END IF;

  -- SECURITY: Validate user exists
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Set notification content based on action
  CASE p_action
    WHEN 'created' THEN
      v_title := 'Kunde erstellt';
      v_content := 'Der Kunde "' || p_customer_name || '" wurde erfolgreich erstellt.';
      -- Only set action_url if customer still exists (not deleted)
      IF p_customer_id IS NOT NULL THEN
        v_action_url := '/dashboard/customers/' || p_customer_id;
      ELSE
        v_action_url := '/dashboard/customers';
      END IF;
    WHEN 'updated' THEN
      v_title := 'Kunde aktualisiert';
      v_content := 'Der Kunde "' || p_customer_name || '" wurde erfolgreich aktualisiert.';
      -- Only set action_url if customer still exists (not deleted)
      IF p_customer_id IS NOT NULL THEN
        v_action_url := '/dashboard/customers/' || p_customer_id;
      ELSE
        v_action_url := '/dashboard/customers';
      END IF;
    WHEN 'deleted' THEN
      v_title := 'Kunde gelöscht';
      v_content := 'Der Kunde "' || p_customer_name || '" wurde erfolgreich gelöscht.';
      -- Don't set action_url for deleted customers (they no longer exist)
      v_action_url := '/dashboard/customers';
    ELSE
      RAISE EXCEPTION 'Invalid action: %', p_action;
  END CASE;

  -- Insert notification with metadata
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
    v_title,
    v_content,
    'CUSTOMER',
    v_action_url,
    jsonb_build_object(
      'action', p_action,
      'customer_name', p_customer_name,
      'customer_id', p_customer_id
    ),
    false,
    NOW()
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION public.create_customer_notification IS 'Create a notification for customer-related actions. For deleted customers, action_url points to customers list instead of the deleted customer page.';

