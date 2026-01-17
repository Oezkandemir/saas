-- Admin Notification Insert Policy
-- Allows admins to create notifications for any user

-- Create policy to allow admins to insert notifications for any user
DROP POLICY IF EXISTS "Admins can insert notifications for any user" ON public.user_notifications;
CREATE POLICY "Admins can insert notifications for any user"
  ON public.user_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Also allow admins to view all notifications (for admin dashboard)
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.user_notifications;
CREATE POLICY "Admins can view all notifications"
  ON public.user_notifications
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );
