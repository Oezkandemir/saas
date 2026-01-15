-- Enable Realtime for inbound_emails table
-- This allows real-time updates when new emails are received
-- IMPORTANT: Run this in Supabase SQL Editor!

-- Step 1: Set REPLICA IDENTITY to FULL (required for Realtime)
ALTER TABLE public.inbound_emails REPLICA IDENTITY FULL;

-- Step 2: Add inbound_emails to realtime publication
-- This will fail silently if already added
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.inbound_emails;
    RAISE NOTICE '✅ Added inbound_emails to supabase_realtime publication';
  EXCEPTION 
    WHEN duplicate_object THEN
      RAISE NOTICE 'ℹ️ inbound_emails is already in supabase_realtime publication';
    WHEN OTHERS THEN
      RAISE WARNING '⚠️ Error adding table to publication: %', SQLERRM;
  END;
END $$;

-- Step 3: Verify the setup
SELECT 
  'Realtime Status' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'inbound_emails'
    ) THEN '✅ Enabled'
    ELSE '❌ Not Enabled - Please check errors above'
  END as status;

SELECT 
  'REPLICA IDENTITY' as check_type,
  CASE 
    WHEN (SELECT relreplident FROM pg_class WHERE relname = 'inbound_emails') = 'f' THEN '✅ FULL'
    ELSE '❌ Not FULL - Realtime may not work correctly'
  END as status;

-- Add comment for documentation
COMMENT ON TABLE public.inbound_emails IS 'Inbound emails with real-time updates enabled via Supabase Realtime';
