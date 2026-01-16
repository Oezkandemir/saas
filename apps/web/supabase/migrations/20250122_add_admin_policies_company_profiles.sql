-- Add admin policies for company_profiles table
-- Allows admins to view, update, and delete all company profiles

-- Admin can view all company profiles
CREATE POLICY "Admins can view all company profiles"
  ON public.company_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Admin can update all company profiles
CREATE POLICY "Admins can update all company profiles"
  ON public.company_profiles
  FOR UPDATE
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

-- Admin can delete all company profiles
CREATE POLICY "Admins can delete all company profiles"
  ON public.company_profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );
