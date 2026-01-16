-- Add Admin RLS Policies for Scheduling Tables
-- This allows users with role = 'ADMIN' to access all scheduling data

-- ============================================
-- ADMIN RLS POLICIES FOR EVENT TYPES
-- ============================================

-- Drop existing admin policy if it exists
DROP POLICY IF EXISTS "Admins can manage all event types" ON public.event_types;

-- Create admin policy for event_types
CREATE POLICY "Admins can manage all event types"
  ON public.event_types
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'ADMIN'
    )
  );

-- ============================================
-- ADMIN RLS POLICIES FOR TIME SLOTS
-- ============================================

-- Drop existing admin policy if it exists
DROP POLICY IF EXISTS "Admins can manage all time slots" ON public.event_type_time_slots;

-- Create admin policy for event_type_time_slots
CREATE POLICY "Admins can manage all time slots"
  ON public.event_type_time_slots
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'ADMIN'
    )
  );

-- ============================================
-- ADMIN RLS POLICIES FOR AVAILABILITY RULES
-- ============================================

-- Drop existing admin policy if it exists
DROP POLICY IF EXISTS "Admins can manage all availability rules" ON public.availability_rules;

-- Create admin policy for availability_rules
CREATE POLICY "Admins can manage all availability rules"
  ON public.availability_rules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'ADMIN'
    )
  );

-- ============================================
-- ADMIN RLS POLICIES FOR AVAILABILITY OVERRIDES
-- ============================================

-- Drop existing admin policy if it exists
DROP POLICY IF EXISTS "Admins can manage all availability overrides" ON public.availability_overrides;

-- Create admin policy for availability_overrides
CREATE POLICY "Admins can manage all availability overrides"
  ON public.availability_overrides
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'ADMIN'
    )
  );

-- ============================================
-- ADMIN RLS POLICIES FOR BOOKINGS
-- ============================================

-- Drop existing admin policy if it exists
DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;

-- Create admin policy for bookings
CREATE POLICY "Admins can manage all bookings"
  ON public.bookings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'ADMIN'
    )
  );

-- ============================================
-- ADMIN RLS POLICIES FOR BOOKING EVENTS
-- ============================================

-- Drop existing admin policy if it exists
DROP POLICY IF EXISTS "Admins can view all booking events" ON public.booking_events;

-- Create admin policy for booking_events
CREATE POLICY "Admins can view all booking events"
  ON public.booking_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'ADMIN'
    )
  );
