-- SECURITY: Secure SECURITY DEFINER functions with input validation and authorization checks
-- This migration adds security improvements to prevent privilege escalation and injection attacks

-- ============================================
-- 1. Secure ban_user function
-- ============================================
CREATE OR REPLACE FUNCTION public.ban_user(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_user_id UUID;
  v_current_user_role TEXT;
BEGIN
  -- SECURITY: Get current user and validate authentication
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- SECURITY: Check if current user is admin
  SELECT role INTO v_current_user_role
  FROM public.users
  WHERE id = v_current_user_id;
  
  IF v_current_user_role IS NULL OR v_current_user_role != 'ADMIN' THEN
    RAISE EXCEPTION 'Not authorized: Admin access required';
  END IF;

  -- SECURITY: Validate input - UUID must not be null
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid input: user_id cannot be null';
  END IF;

  -- SECURITY: Prevent self-banning
  IF user_id = v_current_user_id THEN
    RAISE EXCEPTION 'Cannot ban yourself';
  END IF;

  -- SECURITY: Validate user exists
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Update the user status to banned
  UPDATE public.users 
  SET status = 'banned', updated_at = NOW()
  WHERE id = user_id;
  
  -- Return true if the user was updated
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. Secure unban_user function
-- ============================================
CREATE OR REPLACE FUNCTION public.unban_user(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_user_id UUID;
  v_current_user_role TEXT;
BEGIN
  -- SECURITY: Get current user and validate authentication
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- SECURITY: Check if current user is admin
  SELECT role INTO v_current_user_role
  FROM public.users
  WHERE id = v_current_user_id;
  
  IF v_current_user_role IS NULL OR v_current_user_role != 'ADMIN' THEN
    RAISE EXCEPTION 'Not authorized: Admin access required';
  END IF;

  -- SECURITY: Validate input - UUID must not be null
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid input: user_id cannot be null';
  END IF;

  -- SECURITY: Validate user exists
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Update the user status to active
  UPDATE public.users 
  SET status = 'active', updated_at = NOW()
  WHERE id = user_id;
  
  -- Return true if the user was updated
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. Secure get_all_users function (already has check, but improve it)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS SETOF users AS $$
DECLARE
  v_current_user_id UUID;
  v_current_user_role TEXT;
BEGIN
  -- SECURITY: Get current user and validate authentication
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- SECURITY: Check if the current user is an admin
  SELECT role INTO v_current_user_role
  FROM public.users
  WHERE id = v_current_user_id;
  
  IF v_current_user_role IS NULL OR v_current_user_role != 'ADMIN' THEN
    RAISE EXCEPTION 'Not authorized: Admin access required';
  END IF;

  RETURN QUERY 
  SELECT * FROM public.users 
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. Secure mark_all_notifications_as_read function
-- ============================================
CREATE OR REPLACE FUNCTION public.mark_all_notifications_as_read(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_current_user_id UUID;
BEGIN
  -- SECURITY: Get current user and validate authentication
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- SECURITY: Validate input - UUID must not be null
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid input: p_user_id cannot be null';
  END IF;

  -- SECURITY: Users can only mark their own notifications as read
  -- Admins can mark any user's notifications as read
  IF p_user_id != v_current_user_id THEN
    DECLARE
      v_current_user_role TEXT;
    BEGIN
      SELECT role INTO v_current_user_role
      FROM public.users
      WHERE id = v_current_user_id;
      
      IF v_current_user_role IS NULL OR v_current_user_role != 'ADMIN' THEN
        RAISE EXCEPTION 'Not authorized: Can only mark own notifications as read';
      END IF;
    END;
  END IF;

  -- SECURITY: Validate user exists
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  UPDATE public.user_notifications
  SET read = true, updated_at = NOW()
  WHERE user_id = p_user_id AND read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. Secure get_next_document_number function
-- ============================================
CREATE OR REPLACE FUNCTION public.get_next_document_number(
  p_user_id UUID,
  p_type document_type
)
RETURNS TEXT AS $$
DECLARE
  v_max_number INTEGER;
  v_prefix TEXT;
  v_current_user_id UUID;
BEGIN
  -- SECURITY: Get current user and validate authentication
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- SECURITY: Validate input - UUID must not be null
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid input: p_user_id cannot be null';
  END IF;

  -- SECURITY: Validate document_type is valid
  IF p_type IS NULL OR p_type NOT IN ('quote', 'invoice') THEN
    RAISE EXCEPTION 'Invalid input: p_type must be quote or invoice';
  END IF;

  -- SECURITY: Users can only get document numbers for their own documents
  -- Admins can get document numbers for any user
  IF p_user_id != v_current_user_id THEN
    DECLARE
      v_current_user_role TEXT;
    BEGIN
      SELECT role INTO v_current_user_role
      FROM public.users
      WHERE id = v_current_user_id;
      
      IF v_current_user_role IS NULL OR v_current_user_role != 'ADMIN' THEN
        RAISE EXCEPTION 'Not authorized: Can only get document numbers for own documents';
      END IF;
    END;
  END IF;

  -- SECURITY: Validate user exists
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  v_prefix := CASE WHEN p_type = 'quote' THEN 'A' ELSE 'R' END;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(document_number FROM '[0-9]+') AS INTEGER)), 1000)
  INTO v_max_number
  FROM public.documents
  WHERE user_id = p_user_id
  AND type = p_type
  AND document_number ~ ('^' || v_prefix || '[0-9]+$');
  
  RETURN v_prefix || LPAD((v_max_number + 1)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. Secure update_document_totals function
-- ============================================
CREATE OR REPLACE FUNCTION public.update_document_totals(p_document_id UUID)
RETURNS VOID AS $$
DECLARE
  v_subtotal DECIMAL(10,2);
  v_tax_rate DECIMAL(5,2);
  v_tax_amount DECIMAL(10,2);
  v_total DECIMAL(10,2);
  v_current_user_id UUID;
  v_document_user_id UUID;
BEGIN
  -- SECURITY: Get current user and validate authentication
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- SECURITY: Validate input - UUID must not be null
  IF p_document_id IS NULL THEN
    RAISE EXCEPTION 'Invalid input: p_document_id cannot be null';
  END IF;

  -- SECURITY: Get document owner
  SELECT user_id INTO v_document_user_id
  FROM public.documents
  WHERE id = p_document_id;

  -- SECURITY: Validate document exists
  IF v_document_user_id IS NULL THEN
    RAISE EXCEPTION 'Document not found';
  END IF;

  -- SECURITY: Users can only update totals for their own documents
  -- Admins can update totals for any document
  IF v_document_user_id != v_current_user_id THEN
    DECLARE
      v_current_user_role TEXT;
    BEGIN
      SELECT role INTO v_current_user_role
      FROM public.users
      WHERE id = v_current_user_id;
      
      IF v_current_user_role IS NULL OR v_current_user_role != 'ADMIN' THEN
        RAISE EXCEPTION 'Not authorized: Can only update totals for own documents';
      END IF;
    END;
  END IF;

  -- Calculate subtotal from items
  SELECT COALESCE(SUM(total), 0.00)
  INTO v_subtotal
  FROM public.document_items
  WHERE document_id = p_document_id;
  
  -- Get tax rate from document
  SELECT tax_rate INTO v_tax_rate
  FROM public.documents
  WHERE id = p_document_id;
  
  -- Calculate tax and total
  v_tax_amount := ROUND(v_subtotal * (v_tax_rate / 100), 2);
  v_total := v_subtotal + v_tax_amount;
  
  -- Update document
  UPDATE public.documents
  SET 
    subtotal = v_subtotal,
    tax_amount = v_tax_amount,
    total = v_total,
    updated_at = NOW()
  WHERE id = p_document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. Secure handle_new_user function (from trigger)
-- ============================================
-- Note: This function is called by trigger, so we need to be careful
-- We'll add validation but keep it functional for triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_existing_role TEXT;
BEGIN
  -- SECURITY: Validate input
  IF NEW.id IS NULL THEN
    RAISE EXCEPTION 'Invalid input: user id cannot be null';
  END IF;

  -- Check if user already exists (preserve role on conflict)
  SELECT role INTO v_existing_role
  FROM public.users
  WHERE id = NEW.id;

  IF v_existing_role IS NOT NULL THEN
    -- User already exists - preserve existing role
    -- This prevents admin roles from being reset by triggers
    INSERT INTO public.users (id, email, name, role, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      v_existing_role, -- Preserve existing role
      COALESCE((SELECT created_at FROM public.users WHERE id = NEW.id), NOW()),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      email = EXCLUDED.email,
      updated_at = NOW();
  ELSE
    -- New user - create with default USER role
    INSERT INTO public.users (id, email, name, role, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      'USER', -- Default role for new users
      NOW(),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON FUNCTION public.ban_user IS 'Ban a user. Requires ADMIN role. Prevents self-banning.';
COMMENT ON FUNCTION public.unban_user IS 'Unban a user. Requires ADMIN role.';
COMMENT ON FUNCTION public.get_all_users IS 'Get all users. Requires ADMIN role.';
COMMENT ON FUNCTION public.mark_all_notifications_as_read IS 'Mark all notifications as read for a user. Users can only mark their own notifications, admins can mark any user''s notifications.';
COMMENT ON FUNCTION public.get_next_document_number IS 'Get next document number for a user. Users can only get numbers for their own documents, admins can get numbers for any user.';
COMMENT ON FUNCTION public.update_document_totals IS 'Update document totals. Users can only update totals for their own documents, admins can update totals for any document.';
COMMENT ON FUNCTION public.handle_new_user IS 'Handle new user creation from auth trigger. Preserves existing roles to prevent admin role reset.';

