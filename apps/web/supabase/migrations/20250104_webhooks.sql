-- Webhooks System Migration
-- Allows admins to configure webhooks for various events

-- Create webhooks table
CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of event types: ['document.created', 'qr_code.created', etc.]
  secret TEXT NOT NULL, -- Secret for webhook signature verification
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create webhook_deliveries table for tracking delivery history
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  delivered_at TIMESTAMPTZ DEFAULT NOW(),
  retry_count INTEGER DEFAULT 0
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS webhooks_is_active_idx ON public.webhooks(is_active);
CREATE INDEX IF NOT EXISTS webhook_deliveries_webhook_id_idx ON public.webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS webhook_deliveries_delivered_at_idx ON public.webhook_deliveries(delivered_at DESC);
CREATE INDEX IF NOT EXISTS webhook_deliveries_event_type_idx ON public.webhook_deliveries(event_type);

-- Enable Row Level Security
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhooks
-- Only admins can view all webhooks
DROP POLICY IF EXISTS webhooks_select_admin ON public.webhooks;
CREATE POLICY webhooks_select_admin ON public.webhooks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Only admins can insert webhooks
DROP POLICY IF EXISTS webhooks_insert_admin ON public.webhooks;
CREATE POLICY webhooks_insert_admin ON public.webhooks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Only admins can update webhooks
DROP POLICY IF EXISTS webhooks_update_admin ON public.webhooks;
CREATE POLICY webhooks_update_admin ON public.webhooks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Only admins can delete webhooks
DROP POLICY IF EXISTS webhooks_delete_admin ON public.webhooks;
CREATE POLICY webhooks_delete_admin ON public.webhooks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- RLS Policies for webhook_deliveries
-- Only admins can view webhook deliveries
DROP POLICY IF EXISTS webhook_deliveries_select_admin ON public.webhook_deliveries;
CREATE POLICY webhook_deliveries_select_admin ON public.webhook_deliveries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- System can insert webhook deliveries (via service role)
DROP POLICY IF EXISTS webhook_deliveries_insert_system ON public.webhook_deliveries;
CREATE POLICY webhook_deliveries_insert_system ON public.webhook_deliveries
  FOR INSERT
  WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE public.webhooks IS 'Webhook configurations for event notifications';
COMMENT ON COLUMN public.webhooks.events IS 'Array of event types this webhook subscribes to';
COMMENT ON COLUMN public.webhooks.secret IS 'Secret key for webhook signature verification';
COMMENT ON TABLE public.webhook_deliveries IS 'History of webhook delivery attempts';
COMMENT ON COLUMN public.webhook_deliveries.retry_count IS 'Number of retry attempts for failed deliveries';




















