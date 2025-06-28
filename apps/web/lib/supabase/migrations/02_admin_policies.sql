-- Add admin policies to allow ADMIN users to view and manage all users
-- First, let's add a status field to track banned users
ALTER TABLE IF EXISTS users 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Create a policy to allow admins to view all users
CREATE POLICY "Admins can view all users" 
  ON users FOR SELECT 
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
  );

-- Create a policy to allow admins to update any user
CREATE POLICY "Admins can update any user" 
  ON users FOR UPDATE 
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
  );

-- Create a policy to allow admins to delete any user
CREATE POLICY "Admins can delete any user" 
  ON users FOR DELETE 
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
  );

-- Create a function to ban a user
CREATE OR REPLACE FUNCTION public.ban_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update the user status to banned
  UPDATE users SET status = 'banned' WHERE id = user_id;
  
  -- Return true if the user was updated
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to unban a user
CREATE OR REPLACE FUNCTION public.unban_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update the user status to active
  UPDATE users SET status = 'active' WHERE id = user_id;
  
  -- Return true if the user was updated
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get all users (for admin use)
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS SETOF users AS $$
BEGIN
  -- Check if the current user is an admin
  IF (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN' THEN
    RETURN QUERY SELECT * FROM users ORDER BY created_at DESC;
  ELSE
    RAISE EXCEPTION 'Not authorized';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 