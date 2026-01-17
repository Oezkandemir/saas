-- Usage Statistics Migration
-- Tracks feature usage for analytics and insights

-- Create feature_name enum
DO $$ BEGIN
  CREATE TYPE feature_name AS ENUM (
    'document_created',
    'document_updated',
    'document_deleted',
    'document_viewed',
    'qr_code_created',
    'qr_code_updated',
    'qr_code_deleted',
    'qr_code_scanned',
    'customer_created',
    'customer_updated',
    'customer_deleted',
    'invoice_sent',
    'quote_sent',
    'payment_received',
    'subscription_created',
    'subscription_updated',
    'subscription_cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create feature_usage table
CREATE TABLE IF NOT EXISTS public.feature_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  feature_name feature_name NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional context (e.g., document_id, qr_code_id, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance and analytics queries
CREATE INDEX IF NOT EXISTS feature_usage_user_id_idx ON public.feature_usage(user_id);
CREATE INDEX IF NOT EXISTS feature_usage_feature_name_idx ON public.feature_usage(feature_name);
CREATE INDEX IF NOT EXISTS feature_usage_created_at_idx ON public.feature_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS feature_usage_user_feature_idx ON public.feature_usage(user_id, feature_name);
-- Removed DATE() function from index as it's not IMMUTABLE - use created_at index instead

-- Enable Row Level Security
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own usage statistics
DROP POLICY IF EXISTS feature_usage_select_own ON public.feature_usage;
CREATE POLICY feature_usage_select_own ON public.feature_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all usage statistics
DROP POLICY IF EXISTS feature_usage_select_admin ON public.feature_usage;
CREATE POLICY feature_usage_select_admin ON public.feature_usage
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- System can insert usage statistics (via service role or server actions)
DROP POLICY IF EXISTS feature_usage_insert_system ON public.feature_usage;
CREATE POLICY feature_usage_insert_system ON public.feature_usage
  FOR INSERT
  WITH CHECK (true);

-- Create function to get usage statistics aggregated by day
CREATE OR REPLACE FUNCTION public.get_feature_usage_stats(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW(),
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  date DATE,
  feature_name feature_name,
  usage_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(fu.created_at) as date,
    fu.feature_name,
    COUNT(*)::BIGINT as usage_count
  FROM public.feature_usage fu
  WHERE fu.created_at >= p_start_date
    AND fu.created_at <= p_end_date
    AND (p_user_id IS NULL OR fu.user_id = p_user_id)
  GROUP BY DATE(fu.created_at), fu.feature_name
  ORDER BY date DESC, feature_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get peak usage times
CREATE OR REPLACE FUNCTION public.get_peak_usage_times(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  hour_of_day INTEGER,
  usage_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(HOUR FROM fu.created_at)::INTEGER as hour_of_day,
    COUNT(*)::BIGINT as usage_count
  FROM public.feature_usage fu
  WHERE fu.created_at >= p_start_date
    AND fu.created_at <= p_end_date
  GROUP BY EXTRACT(HOUR FROM fu.created_at)
  ORDER BY usage_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE public.feature_usage IS 'Tracks feature usage for analytics and insights';
COMMENT ON COLUMN public.feature_usage.feature_name IS 'Name of the feature being used';
COMMENT ON COLUMN public.feature_usage.metadata IS 'Additional context about the usage (e.g., resource IDs)';
COMMENT ON FUNCTION public.get_feature_usage_stats IS 'Get aggregated usage statistics by date and feature';
COMMENT ON FUNCTION public.get_peak_usage_times IS 'Get peak usage times by hour of day';

