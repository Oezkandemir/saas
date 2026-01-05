-- Scheduling System Migration
-- Creates tables for Cal.com/Calendly-like scheduling functionality
-- Supports event types, availability rules, overrides, and bookings

-- ============================================
-- ENUMS
-- ============================================

-- Booking status enum
DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('scheduled', 'canceled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Location type enum
DO $$ BEGIN
  CREATE TYPE location_type AS ENUM ('google_meet', 'zoom', 'custom_link', 'phone', 'in_person');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Booking event type enum
DO $$ BEGIN
  CREATE TYPE booking_event_type AS ENUM ('created', 'canceled', 'rescheduled', 'email_sent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- EVENT TYPES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.event_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership (workspace via company_profile_id or user_id)
  company_profile_id UUID REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Event type details
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  buffer_before_minutes INTEGER DEFAULT 0,
  buffer_after_minutes INTEGER DEFAULT 0,
  
  -- Location
  location_type location_type DEFAULT 'google_meet',
  location_value TEXT, -- URL or address
  
  -- Availability settings
  minimum_notice_hours INTEGER DEFAULT 2,
  booking_window_days INTEGER DEFAULT 30,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Optional pricing (for future)
  price_amount DECIMAL(10,2),
  price_currency TEXT DEFAULT 'EUR',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_owner_slug UNIQUE (owner_user_id, slug),
  CONSTRAINT valid_duration CHECK (duration_minutes > 0),
  CONSTRAINT valid_buffer CHECK (buffer_before_minutes >= 0 AND buffer_after_minutes >= 0),
  CONSTRAINT valid_notice CHECK (minimum_notice_hours >= 0),
  CONSTRAINT valid_window CHECK (booking_window_days > 0)
);

-- Indexes for event_types
CREATE INDEX IF NOT EXISTS event_types_owner_user_id_idx ON public.event_types(owner_user_id);
CREATE INDEX IF NOT EXISTS event_types_company_profile_id_idx ON public.event_types(company_profile_id);
CREATE INDEX IF NOT EXISTS event_types_slug_idx ON public.event_types(slug);
CREATE INDEX IF NOT EXISTS event_types_is_active_idx ON public.event_types(is_active);

-- ============================================
-- AVAILABILITY RULES TABLE (Weekly)
-- ============================================

CREATE TABLE IF NOT EXISTS public.availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  company_profile_id UUID REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Weekly schedule (0 = Sunday, 6 = Saturday)
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL, -- Local time (e.g., '09:00:00')
  end_time TIME NOT NULL, -- Local time (e.g., '17:00:00')
  
  -- Timezone (e.g., 'Europe/Berlin')
  timezone TEXT NOT NULL DEFAULT 'Europe/Berlin',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Indexes for availability_rules
CREATE INDEX IF NOT EXISTS availability_rules_user_id_idx ON public.availability_rules(user_id);
CREATE INDEX IF NOT EXISTS availability_rules_company_profile_id_idx ON public.availability_rules(company_profile_id);
CREATE INDEX IF NOT EXISTS availability_rules_day_of_week_idx ON public.availability_rules(day_of_week);

-- ============================================
-- AVAILABILITY OVERRIDES TABLE (Date-specific)
-- ============================================

CREATE TABLE IF NOT EXISTS public.availability_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  company_profile_id UUID REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Date override
  date DATE NOT NULL,
  is_unavailable BOOLEAN DEFAULT false,
  start_time TIME, -- Optional: specific time range for override
  end_time TIME,
  
  -- Timezone
  timezone TEXT NOT NULL DEFAULT 'Europe/Berlin',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_override_time_range CHECK (
    (start_time IS NULL AND end_time IS NULL) OR
    (start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
  )
);

-- Indexes for availability_overrides
CREATE INDEX IF NOT EXISTS availability_overrides_user_id_idx ON public.availability_overrides(user_id);
CREATE INDEX IF NOT EXISTS availability_overrides_company_profile_id_idx ON public.availability_overrides(company_profile_id);
CREATE INDEX IF NOT EXISTS availability_overrides_date_idx ON public.availability_overrides(date);
CREATE INDEX IF NOT EXISTS availability_overrides_date_user_idx ON public.availability_overrides(date, user_id);

-- ============================================
-- BOOKINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  company_profile_id UUID REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  event_type_id UUID NOT NULL REFERENCES public.event_types(id) ON DELETE CASCADE,
  host_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Invitee information
  invitee_name TEXT NOT NULL,
  invitee_email TEXT NOT NULL,
  invitee_notes TEXT,
  
  -- Booking time (stored as UTC timestamptz)
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  
  -- Status
  status booking_status DEFAULT 'scheduled',
  cancel_reason TEXT,
  
  -- Security tokens for public cancellation/rescheduling
  cancel_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  reschedule_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_booking_time CHECK (start_at < end_at)
);

-- Indexes for bookings
CREATE INDEX IF NOT EXISTS bookings_event_type_id_idx ON public.bookings(event_type_id);
CREATE INDEX IF NOT EXISTS bookings_host_user_id_idx ON public.bookings(host_user_id);
CREATE INDEX IF NOT EXISTS bookings_start_at_idx ON public.bookings(start_at);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON public.bookings(status);
CREATE INDEX IF NOT EXISTS bookings_cancel_token_idx ON public.bookings(cancel_token);
CREATE INDEX IF NOT EXISTS bookings_company_profile_id_idx ON public.bookings(company_profile_id);
CREATE INDEX IF NOT EXISTS bookings_date_range_idx ON public.bookings USING btree (start_at, end_at) WHERE status = 'scheduled';

-- ============================================
-- BOOKING EVENTS TABLE (Audit/History)
-- ============================================

CREATE TABLE IF NOT EXISTS public.booking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  type booking_event_type NOT NULL,
  meta_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for booking_events
CREATE INDEX IF NOT EXISTS booking_events_booking_id_idx ON public.booking_events(booking_id);
CREATE INDEX IF NOT EXISTS booking_events_type_idx ON public.booking_events(type);
CREATE INDEX IF NOT EXISTS booking_events_created_at_idx ON public.booking_events(created_at);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_events ENABLE ROW LEVEL SECURITY;

-- EVENT TYPES POLICIES
-- Users can view their own event types or event types from their company profiles
CREATE POLICY "Users can view their own event types"
  ON public.event_types
  FOR SELECT
  USING (
    auth.uid() = owner_user_id OR
    EXISTS (
      SELECT 1 FROM public.company_profiles cp
      WHERE cp.id = event_types.company_profile_id
      AND cp.user_id = auth.uid()
    )
  );

-- Users can create their own event types
CREATE POLICY "Users can create their own event types"
  ON public.event_types
  FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

-- Users can update their own event types
CREATE POLICY "Users can update their own event types"
  ON public.event_types
  FOR UPDATE
  USING (auth.uid() = owner_user_id);

-- Users can delete their own event types
CREATE POLICY "Users can delete their own event types"
  ON public.event_types
  FOR DELETE
  USING (auth.uid() = owner_user_id);

-- Public can view active event types (for booking pages)
CREATE POLICY "Public can view active event types"
  ON public.event_types
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- AVAILABILITY RULES POLICIES
CREATE POLICY "Users can manage their own availability rules"
  ON public.availability_rules
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- AVAILABILITY OVERRIDES POLICIES
CREATE POLICY "Users can manage their own availability overrides"
  ON public.availability_overrides
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- BOOKINGS POLICIES
-- Users can view bookings for their event types
CREATE POLICY "Users can view their bookings"
  ON public.bookings
  FOR SELECT
  USING (
    auth.uid() = host_user_id OR
    EXISTS (
      SELECT 1 FROM public.event_types et
      WHERE et.id = bookings.event_type_id
      AND et.owner_user_id = auth.uid()
    )
  );

-- Public can create bookings via server action (RLS will be handled in server action)
-- For now, we allow authenticated users to insert bookings
CREATE POLICY "Authenticated users can create bookings"
  ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.event_types et
      WHERE et.id = bookings.event_type_id
      AND et.is_active = true
    )
  );

-- Users can update their own bookings (for cancellation)
CREATE POLICY "Users can update their own bookings"
  ON public.bookings
  FOR UPDATE
  USING (auth.uid() = host_user_id);

-- Users can delete their own bookings
CREATE POLICY "Users can delete their own bookings"
  ON public.bookings
  FOR DELETE
  USING (auth.uid() = host_user_id);

-- BOOKING EVENTS POLICIES
CREATE POLICY "Users can view booking events for their bookings"
  ON public.booking_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_events.booking_id
      AND b.host_user_id = auth.uid()
    )
  );

CREATE POLICY "System can create booking events"
  ON public.booking_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp for event_types
CREATE OR REPLACE FUNCTION update_event_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_types_updated_at
  BEFORE UPDATE ON public.event_types
  FOR EACH ROW
  EXECUTE FUNCTION update_event_types_updated_at();

-- Update updated_at timestamp for bookings
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_bookings_updated_at();

-- Auto-create booking event on booking creation
CREATE OR REPLACE FUNCTION create_booking_created_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.booking_events (booking_id, type, meta_json)
  VALUES (
    NEW.id,
    'created',
    jsonb_build_object(
      'invitee_name', NEW.invitee_name,
      'invitee_email', NEW.invitee_email,
      'event_type_id', NEW.event_type_id
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_booking_created_event
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION create_booking_created_event();

-- Auto-create booking event on booking cancellation
CREATE OR REPLACE FUNCTION create_booking_canceled_event()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'canceled' AND OLD.status != 'canceled' THEN
    INSERT INTO public.booking_events (booking_id, type, meta_json)
    VALUES (
      NEW.id,
      'canceled',
      jsonb_build_object(
        'cancel_reason', NEW.cancel_reason,
        'canceled_at', NOW()
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_booking_canceled_event
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION create_booking_canceled_event();





