-- Inbound Email Replies Migration
-- Creates table for storing replies to inbound emails

-- Create inbound_email_replies table
CREATE TABLE IF NOT EXISTS public.inbound_email_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inbound_email_id UUID NOT NULL REFERENCES public.inbound_emails(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  html_body TEXT,
  message_id TEXT, -- Resend message ID for tracking
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS inbound_email_replies_inbound_email_id_idx ON public.inbound_email_replies(inbound_email_id);
CREATE INDEX IF NOT EXISTS inbound_email_replies_user_id_idx ON public.inbound_email_replies(user_id);
CREATE INDEX IF NOT EXISTS inbound_email_replies_sent_at_idx ON public.inbound_email_replies(sent_at DESC);
CREATE INDEX IF NOT EXISTS inbound_email_replies_message_id_idx ON public.inbound_email_replies(message_id);

-- Enable Row Level Security
ALTER TABLE public.inbound_email_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inbound_email_replies
-- Only admins can view replies
DROP POLICY IF EXISTS inbound_email_replies_select_admin ON public.inbound_email_replies;
CREATE POLICY inbound_email_replies_select_admin ON public.inbound_email_replies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Only admins can insert replies
DROP POLICY IF EXISTS inbound_email_replies_insert_admin ON public.inbound_email_replies;
CREATE POLICY inbound_email_replies_insert_admin ON public.inbound_email_replies
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Only admins can update replies
DROP POLICY IF EXISTS inbound_email_replies_update_admin ON public.inbound_email_replies;
CREATE POLICY inbound_email_replies_update_admin ON public.inbound_email_replies
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Only admins can delete replies
DROP POLICY IF EXISTS inbound_email_replies_delete_admin ON public.inbound_email_replies;
CREATE POLICY inbound_email_replies_delete_admin ON public.inbound_email_replies
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Comments for documentation
COMMENT ON TABLE public.inbound_email_replies IS 'Replies sent to inbound emails';
COMMENT ON COLUMN public.inbound_email_replies.message_id IS 'Resend message ID for tracking sent emails';
