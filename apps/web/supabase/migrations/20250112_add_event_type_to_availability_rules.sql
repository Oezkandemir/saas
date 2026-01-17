-- Add event_type_id to availability_rules to support per-event-type availability
ALTER TABLE public.availability_rules
ADD COLUMN IF NOT EXISTS event_type_id UUID REFERENCES public.event_types(id) ON DELETE CASCADE;

-- Create index for event_type_id
CREATE INDEX IF NOT EXISTS availability_rules_event_type_id_idx ON public.availability_rules(event_type_id);

-- Update constraint to allow either user_id (global) or event_type_id (per-event) but not both
-- For now, we'll allow both for backward compatibility, but prefer event_type_id when present

-- Update RLS policy to allow access to availability rules for event types
CREATE POLICY IF NOT EXISTS "Users can view availability rules for their event types"
  ON public.availability_rules
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.event_types et
      WHERE et.id = availability_rules.event_type_id
      AND et.owner_user_id = auth.uid()
    )
  );

-- Update existing policy to also check event_type_id
DROP POLICY IF EXISTS "Users can manage their own availability rules" ON public.availability_rules;

CREATE POLICY "Users can manage their own availability rules"
  ON public.availability_rules
  FOR ALL
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.event_types et
      WHERE et.id = availability_rules.event_type_id
      AND et.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.event_types et
      WHERE et.id = availability_rules.event_type_id
      AND et.owner_user_id = auth.uid()
    )
  );

