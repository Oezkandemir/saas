-- Check and Enable Realtime for support_ticket_messages table
-- Run this in Supabase SQL Editor to verify and enable Realtime

-- Step 1: Check if table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'support_ticket_messages'
  ) THEN
    RAISE EXCEPTION 'Table support_ticket_messages does not exist';
  END IF;
END $$;

-- Step 2: Set REPLICA IDENTITY to FULL (required for Realtime)
ALTER TABLE public.support_ticket_messages REPLICA IDENTITY FULL;

-- Step 3: Check if table is already in publication
DO $$
DECLARE
  is_in_publication BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'support_ticket_messages'
  ) INTO is_in_publication;
  
  IF NOT is_in_publication THEN
    -- Add table to publication
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_ticket_messages;
    RAISE NOTICE 'Added support_ticket_messages to supabase_realtime publication';
  ELSE
    RAISE NOTICE 'support_ticket_messages is already in supabase_realtime publication';
  END IF;
END $$;

-- Step 4: Verify the setup
SELECT 
  'Realtime Status' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'support_ticket_messages'
    ) THEN '✅ Enabled'
    ELSE '❌ Not Enabled'
  END as status;

SELECT 
  'REPLICA IDENTITY' as check_type,
  CASE 
    WHEN (SELECT relreplident FROM pg_class WHERE relname = 'support_ticket_messages') = 'f' THEN '✅ FULL'
    ELSE '❌ Not FULL'
  END as status;


