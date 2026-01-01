-- Rate Limiting Tables
-- Implements IP-based and user-based rate limiting for API security

-- Rate limit tracking table
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- IP address or user_id
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('ip', 'user')),
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(identifier, identifier_type, endpoint, window_start)
);

-- Rate limit configuration table
CREATE TABLE IF NOT EXISTS rate_limit_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL UNIQUE,
  max_requests INTEGER NOT NULL DEFAULT 100,
  window_seconds INTEGER NOT NULL DEFAULT 60,
  block_duration_seconds INTEGER NOT NULL DEFAULT 300,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS rate_limits_identifier_idx ON rate_limits(identifier, identifier_type);
CREATE INDEX IF NOT EXISTS rate_limits_endpoint_idx ON rate_limits(endpoint);
CREATE INDEX IF NOT EXISTS rate_limits_window_start_idx ON rate_limits(window_start);
CREATE INDEX IF NOT EXISTS rate_limits_blocked_until_idx ON rate_limits(blocked_until) WHERE blocked_until IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Only system/service role can manage rate limits
CREATE POLICY "Service role can manage rate limits"
  ON rate_limits
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Admins can view rate limit configs
CREATE POLICY "Admins can view rate limit configs"
  ON rate_limit_configs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Service role can manage configs
CREATE POLICY "Service role can manage rate limit configs"
  ON rate_limit_configs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to check and update rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_identifier_type TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 100,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS TABLE(
  allowed BOOLEAN,
  remaining INTEGER,
  reset_at TIMESTAMP WITH TIME ZONE,
  blocked BOOLEAN
) AS $$
DECLARE
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_current_count INTEGER;
  v_blocked_until TIMESTAMP WITH TIME ZONE;
  v_allowed BOOLEAN;
  v_remaining INTEGER;
BEGIN
  -- Calculate window start (current time rounded down to window)
  v_window_start := date_trunc('second', NOW() - (EXTRACT(EPOCH FROM NOW())::INTEGER % p_window_seconds || ' seconds')::INTERVAL);
  
  -- Check if currently blocked
  SELECT blocked_until INTO v_blocked_until
  FROM rate_limits
  WHERE identifier = p_identifier
    AND identifier_type = p_identifier_type
    AND endpoint = p_endpoint
    AND blocked_until > NOW()
  ORDER BY blocked_until DESC
  LIMIT 1;
  
  IF v_blocked_until IS NOT NULL THEN
    RETURN QUERY SELECT false, 0, v_blocked_until, true;
    RETURN;
  END IF;
  
  -- Get or create rate limit record for current window
  INSERT INTO rate_limits (identifier, identifier_type, endpoint, request_count, window_start)
  VALUES (p_identifier, p_identifier_type, p_endpoint, 1, v_window_start)
  ON CONFLICT (identifier, identifier_type, endpoint, window_start)
  DO UPDATE SET
    request_count = rate_limits.request_count + 1,
    updated_at = NOW()
  RETURNING request_count INTO v_current_count;
  
  -- Calculate remaining requests
  v_remaining := GREATEST(0, p_max_requests - v_current_count);
  v_allowed := v_current_count <= p_max_requests;
  
  -- Calculate reset time (end of current window)
  RETURN QUERY SELECT
    v_allowed,
    v_remaining,
    v_window_start + (p_window_seconds || ' seconds')::INTERVAL,
    false;
END;
$$ LANGUAGE plpgsql;

-- Function to block an identifier
CREATE OR REPLACE FUNCTION block_rate_limit(
  p_identifier TEXT,
  p_identifier_type TEXT,
  p_endpoint TEXT,
  p_block_duration_seconds INTEGER DEFAULT 300
)
RETURNS void AS $$
BEGIN
  UPDATE rate_limits
  SET blocked_until = NOW() + (p_block_duration_seconds || ' seconds')::INTERVAL,
      updated_at = NOW()
  WHERE identifier = p_identifier
    AND identifier_type = p_identifier_type
    AND endpoint = p_endpoint;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old rate limit records
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < NOW() - INTERVAL '24 hours'
    AND (blocked_until IS NULL OR blocked_until < NOW());
END;
$$ LANGUAGE plpgsql;

-- Insert default rate limit configurations
INSERT INTO rate_limit_configs (endpoint, max_requests, window_seconds, block_duration_seconds, enabled)
VALUES
  ('/api/auth/login', 5, 60, 900, true), -- 5 requests per minute, block for 15 minutes
  ('/api/auth/register', 3, 300, 1800, true), -- 3 requests per 5 minutes, block for 30 minutes
  ('/api/auth/reset-password', 3, 300, 1800, true), -- 3 requests per 5 minutes
  ('/api/*', 100, 60, 300, true) -- Default: 100 requests per minute
ON CONFLICT (endpoint) DO NOTHING;

-- Comments
COMMENT ON TABLE rate_limits IS 'Tracks rate limit usage for IP addresses and users';
COMMENT ON TABLE rate_limit_configs IS 'Configuration for rate limits per endpoint';
COMMENT ON FUNCTION check_rate_limit IS 'Checks if a request should be allowed based on rate limits';
COMMENT ON FUNCTION block_rate_limit IS 'Blocks an identifier for a specified duration';
COMMENT ON FUNCTION cleanup_rate_limits IS 'Cleans up old rate limit records';

