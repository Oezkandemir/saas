-- Admin Notification Delete and Update Policies
-- Allows admins to delete and update notifications for any user

-- Create policy to allow admins to delete notifications for any user
DROP POLICY IF EXISTS "Admins can delete notifications for any user" ON public.user_notifications;
CREATE POLICY "Admins can delete notifications for any user"
  ON public.user_notifications
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Create policy to allow admins to update notifications for any user
DROP POLICY IF EXISTS "Admins can update notifications for any user" ON public.user_notifications;
CREATE POLICY "Admins can update notifications for any user"
  ON public.user_notifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Comments
COMMENT ON POLICY "Admins can delete notifications for any user" ON public.user_notifications IS 'Allows admin users to delete any notification';
COMMENT ON POLICY "Admins can update notifications for any user" ON public.user_notifications IS 'Allows admin users to update any notification';
