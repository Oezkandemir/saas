-- Add email features: soft delete, starred, archived
-- This migration adds fields for Gmail-like features

-- Add is_deleted field for soft delete (prevents re-syncing deleted emails)
ALTER TABLE public.inbound_emails 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Add deleted_at timestamp
ALTER TABLE public.inbound_emails 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add is_starred field for favorites
ALTER TABLE public.inbound_emails 
ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT false;

-- Add is_archived field for archive functionality
ALTER TABLE public.inbound_emails 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Add archived_at timestamp
ALTER TABLE public.inbound_emails 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS inbound_emails_is_deleted_idx ON public.inbound_emails(is_deleted) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS inbound_emails_is_starred_idx ON public.inbound_emails(is_starred) WHERE is_starred = true;
CREATE INDEX IF NOT EXISTS inbound_emails_is_archived_idx ON public.inbound_emails(is_archived) WHERE is_archived = false;

-- Update RLS policy to exclude deleted emails by default
-- Note: We'll handle filtering in application code, but this ensures deleted emails are still accessible for admin operations

-- Comments
COMMENT ON COLUMN public.inbound_emails.is_deleted IS 'Soft delete flag - deleted emails should not be re-synced';
COMMENT ON COLUMN public.inbound_emails.deleted_at IS 'Timestamp when email was deleted';
COMMENT ON COLUMN public.inbound_emails.is_starred IS 'Star/favorite flag for important emails';
COMMENT ON COLUMN public.inbound_emails.is_archived IS 'Archive flag - archived emails are hidden from inbox but not deleted';
COMMENT ON COLUMN public.inbound_emails.archived_at IS 'Timestamp when email was archived';
