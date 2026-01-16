-- Add missing time slots table and booking fields
-- This migration adds the event_type_time_slots table and missing columns to bookings

-- ============================================
-- EVENT TYPE TIME SLOTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.event_type_time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type_id UUID NOT NULL REFERENCES public.event_types(id) ON DELETE CASCADE,
  start_time TIME NOT NULL, -- Local time (e.g., '09:00:00')
  end_time TIME NOT NULL, -- Local time (e.g., '17:00:00')
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- NULL = all days, 0 = Sunday, 6 = Saturday
  max_participants INTEGER CHECK (max_participants > 0), -- NULL = no limit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_time_slot_range CHECK (start_time < end_time)
);

-- Indexes for event_type_time_slots
CREATE INDEX IF NOT EXISTS event_type_time_slots_event_type_id_idx ON public.event_type_time_slots(event_type_id);
CREATE INDEX IF NOT EXISTS event_type_time_slots_day_of_week_idx ON public.event_type_time_slots(day_of_week);
CREATE INDEX IF NOT EXISTS event_type_time_slots_time_range_idx ON public.event_type_time_slots(start_time, end_time);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_event_type_time_slots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_type_time_slots_updated_at
  BEFORE UPDATE ON public.event_type_time_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_event_type_time_slots_updated_at();

-- Enable RLS on event_type_time_slots
ALTER TABLE public.event_type_time_slots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_type_time_slots
CREATE POLICY "Users can view time slots for their event types"
  ON public.event_type_time_slots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.event_types et
      WHERE et.id = event_type_time_slots.event_type_id
      AND et.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage time slots for their event types"
  ON public.event_type_time_slots
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.event_types et
      WHERE et.id = event_type_time_slots.event_type_id
      AND et.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.event_types et
      WHERE et.id = event_type_time_slots.event_type_id
      AND et.owner_user_id = auth.uid()
    )
  );

-- ============================================
-- ADD MISSING COLUMNS TO BOOKINGS TABLE
-- ============================================

-- Add time_slot_id to bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS time_slot_id UUID REFERENCES public.event_type_time_slots(id) ON DELETE SET NULL;

-- Add number_of_participants to bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS number_of_participants INTEGER DEFAULT 1 CHECK (number_of_participants > 0);

-- Add participant_names to bookings (as JSONB array)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS participant_names JSONB DEFAULT NULL;

-- Create index for time_slot_id
CREATE INDEX IF NOT EXISTS bookings_time_slot_id_idx ON public.bookings(time_slot_id);

-- ============================================
-- ADD EVENT_TYPE_ID TO AVAILABILITY_OVERRIDES
-- ============================================

-- Add event_type_id to availability_overrides
ALTER TABLE public.availability_overrides
ADD COLUMN IF NOT EXISTS event_type_id UUID REFERENCES public.event_types(id) ON DELETE CASCADE;

-- Create index for event_type_id
CREATE INDEX IF NOT EXISTS availability_overrides_event_type_id_idx ON public.availability_overrides(event_type_id);

-- Update RLS policy for availability_overrides to include event_type_id
DROP POLICY IF EXISTS "Users can manage their own availability overrides" ON public.availability_overrides;

CREATE POLICY "Users can manage their own availability overrides"
  ON public.availability_overrides
  FOR ALL
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.event_types et
      WHERE et.id = availability_overrides.event_type_id
      AND et.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.event_types et
      WHERE et.id = availability_overrides.event_type_id
      AND et.owner_user_id = auth.uid()
    )
  );

-- Add policy for viewing availability overrides for event types
CREATE POLICY IF NOT EXISTS "Users can view availability overrides for their event types"
  ON public.availability_overrides
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.event_types et
      WHERE et.id = availability_overrides.event_type_id
      AND et.owner_user_id = auth.uid()
    )
  );

-- ============================================
-- ADMIN RLS POLICIES
-- ============================================

-- Allow admins to access all scheduling tables
-- Note: These policies assume admins have role = 'ADMIN' in the users table

-- Admin access to event_types
CREATE POLICY IF NOT EXISTS "Admins can manage all event types"
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

-- Admin access to event_type_time_slots
CREATE POLICY IF NOT EXISTS "Admins can manage all time slots"
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

-- Admin access to availability_rules
CREATE POLICY IF NOT EXISTS "Admins can manage all availability rules"
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

-- Admin access to availability_overrides
CREATE POLICY IF NOT EXISTS "Admins can manage all availability overrides"
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

-- Admin access to bookings (already exists but ensure it's comprehensive)
CREATE POLICY IF NOT EXISTS "Admins can manage all bookings"
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

-- Admin access to booking_events
CREATE POLICY IF NOT EXISTS "Admins can view all booking events"
  ON public.booking_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'ADMIN'
    )
  );
