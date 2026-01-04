-- Fix bookings RLS policy to allow anonymous users to create bookings
-- This is needed for public booking pages where users don't need to be authenticated

-- Drop the existing policy that only allows authenticated users
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON public.bookings;

-- Create a new policy that allows both authenticated and anonymous users to create bookings
-- The policy ensures that bookings can only be created for active event types
CREATE POLICY "Public can create bookings for active event types"
  ON public.bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.event_types et
      WHERE et.id = bookings.event_type_id
      AND et.is_active = true
    )
  );

