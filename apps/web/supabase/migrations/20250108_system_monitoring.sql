-- System Monitoring Tables Migration
-- Creates tables for system error tracking, status monitoring, and metrics

-- ============================================
-- SYSTEM ERRORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.system_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component TEXT NOT NULL CHECK (component IN ('database', 'api', 'auth', 'email', 'storage', 'payment')),
  error_type TEXT NOT NULL CHECK (error_type IN ('critical', 'warning', 'info')),
  error_message TEXT NOT NULL,
  error_stack TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for system_errors
CREATE INDEX IF NOT EXISTS system_errors_component_idx ON public.system_errors(component);
CREATE INDEX IF NOT EXISTS system_errors_error_type_idx ON public.system_errors(error_type);
CREATE INDEX IF NOT EXISTS system_errors_resolved_idx ON public.system_errors(resolved);
CREATE INDEX IF NOT EXISTS system_errors_created_at_idx ON public.system_errors(created_at DESC);
CREATE INDEX IF NOT EXISTS system_errors_user_id_idx ON public.system_errors(user_id);

-- ============================================
-- SYSTEM STATUS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.system_status (
  component TEXT PRIMARY KEY CHECK (component IN ('database', 'api', 'auth', 'email', 'storage', 'payment')),
  status TEXT NOT NULL CHECK (status IN ('operational', 'degraded', 'down', 'maintenance')),
  message TEXT,
  last_check TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for system_status
CREATE INDEX IF NOT EXISTS system_status_status_idx ON public.system_status(status);
CREATE INDEX IF NOT EXISTS system_status_last_check_idx ON public.system_status(last_check DESC);

-- ============================================
-- SYSTEM METRICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component TEXT NOT NULL CHECK (component IN ('database', 'api', 'auth', 'email', 'storage', 'payment')),
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(15, 4) NOT NULL,
  unit TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for system_metrics
CREATE INDEX IF NOT EXISTS system_metrics_component_idx ON public.system_metrics(component);
CREATE INDEX IF NOT EXISTS system_metrics_metric_name_idx ON public.system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS system_metrics_created_at_idx ON public.system_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS system_metrics_component_metric_idx ON public.system_metrics(component, metric_name);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.system_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

-- System Errors Policies
-- Admins can view all errors
CREATE POLICY system_errors_admin_select ON public.system_errors
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- System can insert errors (via service role)
CREATE POLICY system_errors_insert ON public.system_errors
  FOR INSERT
  WITH CHECK (true);

-- Admins can update errors (mark as resolved)
CREATE POLICY system_errors_admin_update ON public.system_errors
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- System Status Policies
-- Admins can view status
CREATE POLICY system_status_admin_select ON public.system_status
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- System can upsert status (via service role)
CREATE POLICY system_status_upsert ON public.system_status
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- System Metrics Policies
-- Admins can view metrics
CREATE POLICY system_metrics_admin_select ON public.system_metrics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- System can insert metrics (via service role)
CREATE POLICY system_metrics_insert ON public.system_metrics
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- INITIAL STATUS DATA
-- ============================================
INSERT INTO public.system_status (component, status, message, last_check)
VALUES
  ('database', 'operational', 'Database connection healthy', NOW()),
  ('api', 'operational', 'API responding normally', NOW()),
  ('auth', 'operational', 'Authentication service operational', NOW()),
  ('email', 'operational', 'Email service operational', NOW()),
  ('storage', 'operational', 'Storage service operational', NOW()),
  ('payment', 'operational', 'Payment service operational', NOW())
ON CONFLICT (component) DO NOTHING;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_system_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on system_status
DROP TRIGGER IF EXISTS system_status_updated_at_trigger ON public.system_status;
CREATE TRIGGER system_status_updated_at_trigger
  BEFORE UPDATE ON public.system_status
  FOR EACH ROW
  EXECUTE FUNCTION update_system_status_updated_at();

-- Function to clean up old resolved errors (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_resolved_errors()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.system_errors
  WHERE resolved = true
    AND resolved_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old metrics (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_metrics()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.system_metrics
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.system_errors IS 'Stores system errors and exceptions for monitoring and debugging';
COMMENT ON TABLE public.system_status IS 'Tracks the current status of system components';
COMMENT ON TABLE public.system_metrics IS 'Stores system performance metrics and statistics';

COMMENT ON COLUMN public.system_errors.component IS 'The system component where the error occurred';
COMMENT ON COLUMN public.system_errors.error_type IS 'Severity level: critical, warning, or info';
COMMENT ON COLUMN public.system_errors.resolved IS 'Whether the error has been resolved';
COMMENT ON COLUMN public.system_status.status IS 'Current status: operational, degraded, down, or maintenance';


















