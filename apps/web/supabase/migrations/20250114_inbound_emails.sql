-- Inbound Emails Migration
-- Creates tables for storing incoming emails from Resend Inbound

-- Create inbound_emails table
CREATE TABLE IF NOT EXISTS public.inbound_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id TEXT NOT NULL UNIQUE, -- Resend Email ID
  message_id TEXT, -- Email Message ID
  from_email TEXT NOT NULL, -- Sender email address
  from_name TEXT, -- Sender name (optional)
  "to" TEXT[] NOT NULL DEFAULT '{}', -- Array of recipient emails
  cc TEXT[] DEFAULT '{}', -- CC recipients
  bcc TEXT[] DEFAULT '{}', -- BCC recipients
  subject TEXT, -- Email subject
  text_content TEXT, -- Plain text content
  html_content TEXT, -- HTML content
  raw_payload JSONB, -- Full webhook payload for debugging
  is_read BOOLEAN DEFAULT false, -- Read status
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- When email was received
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create inbound_email_attachments table
CREATE TABLE IF NOT EXISTS public.inbound_email_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inbound_email_id UUID NOT NULL REFERENCES public.inbound_emails(id) ON DELETE CASCADE,
  attachment_id TEXT NOT NULL, -- Resend Attachment ID
  filename TEXT NOT NULL, -- File name
  content_type TEXT, -- MIME type
  content_disposition TEXT, -- inline/attachment
  size INTEGER, -- File size in bytes
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS inbound_emails_received_at_idx ON public.inbound_emails(received_at DESC);
CREATE INDEX IF NOT EXISTS inbound_emails_from_email_idx ON public.inbound_emails(from_email);
CREATE INDEX IF NOT EXISTS inbound_emails_is_read_idx ON public.inbound_emails(is_read);
CREATE INDEX IF NOT EXISTS inbound_emails_email_id_idx ON public.inbound_emails(email_id);
CREATE INDEX IF NOT EXISTS inbound_email_attachments_email_id_idx ON public.inbound_email_attachments(inbound_email_id);

-- Enable Row Level Security
ALTER TABLE public.inbound_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbound_email_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inbound_emails
-- Only admins can view inbound emails
DROP POLICY IF EXISTS inbound_emails_select_admin ON public.inbound_emails;
CREATE POLICY inbound_emails_select_admin ON public.inbound_emails
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- System can insert inbound emails (via service role/webhook)
DROP POLICY IF EXISTS inbound_emails_insert_system ON public.inbound_emails;
CREATE POLICY inbound_emails_insert_system ON public.inbound_emails
  FOR INSERT
  WITH CHECK (true);

-- Only admins can update inbound emails (mark as read/unread)
DROP POLICY IF EXISTS inbound_emails_update_admin ON public.inbound_emails;
CREATE POLICY inbound_emails_update_admin ON public.inbound_emails
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Only admins can delete inbound emails
DROP POLICY IF EXISTS inbound_emails_delete_admin ON public.inbound_emails;
CREATE POLICY inbound_emails_delete_admin ON public.inbound_emails
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- RLS Policies for inbound_email_attachments
-- Only admins can view attachments
DROP POLICY IF EXISTS inbound_email_attachments_select_admin ON public.inbound_email_attachments;
CREATE POLICY inbound_email_attachments_select_admin ON public.inbound_email_attachments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- System can insert attachments (via service role/webhook)
DROP POLICY IF EXISTS inbound_email_attachments_insert_system ON public.inbound_email_attachments;
CREATE POLICY inbound_email_attachments_insert_system ON public.inbound_email_attachments
  FOR INSERT
  WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE public.inbound_emails IS 'Incoming emails received via Resend Inbound';
COMMENT ON COLUMN public.inbound_emails.email_id IS 'Unique Resend Email ID';
COMMENT ON COLUMN public.inbound_emails.raw_payload IS 'Full webhook payload for debugging purposes';
COMMENT ON TABLE public.inbound_email_attachments IS 'Attachments for inbound emails';
