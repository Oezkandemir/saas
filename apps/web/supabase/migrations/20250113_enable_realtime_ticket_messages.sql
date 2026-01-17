-- Enable Realtime for support_ticket_messages table
-- This allows real-time updates when new messages are added to tickets
-- IMPORTANT: Run this in Supabase SQL Editor!

-- Step 1: Set REPLICA IDENTITY to FULL (required for Realtime)
ALTER TABLE public.support_ticket_messages REPLICA IDENTITY FULL;

-- Step 2: Add support_ticket_messages to realtime publication
-- This will fail silently if already added
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_ticket_messages;
    RAISE NOTICE '✅ Added support_ticket_messages to supabase_realtime publication';
  EXCEPTION 
    WHEN duplicate_object THEN
      RAISE NOTICE 'ℹ️ support_ticket_messages is already in supabase_realtime publication';
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
      AND tablename = 'support_ticket_messages'
    ) THEN '✅ Enabled'
    ELSE '❌ Not Enabled - Please check errors above'
  END as status;

SELECT 
  'REPLICA IDENTITY' as check_type,
  CASE 
    WHEN (SELECT relreplident FROM pg_class WHERE relname = 'support_ticket_messages') = 'f' THEN '✅ FULL'
    ELSE '❌ Not FULL - Realtime may not work correctly'
  END as status;

-- Add comment for documentation
COMMENT ON TABLE public.support_ticket_messages IS 'Support ticket messages with real-time updates enabled via Supabase Realtime';
