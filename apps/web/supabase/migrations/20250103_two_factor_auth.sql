-- Two-Factor Authentication (2FA/MFA) Support
-- TOTP-based two-factor authentication for enhanced security

-- Create two_factor_auth table
CREATE TABLE IF NOT EXISTS two_factor_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  backup_codes TEXT[] NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create login_sessions table for session tracking
CREATE TABLE IF NOT EXISTS login_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_info JSONB,
  location_info JSONB,
  is_current BOOLEAN DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create login_history table
CREATE TABLE IF NOT EXISTS login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  device_info JSONB,
  location_info JSONB,
  success BOOLEAN NOT NULL DEFAULT true,
  failure_reason TEXT,
  two_factor_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS two_factor_auth_user_id_idx ON two_factor_auth(user_id);
CREATE INDEX IF NOT EXISTS login_sessions_user_id_idx ON login_sessions(user_id);
CREATE INDEX IF NOT EXISTS login_sessions_session_token_idx ON login_sessions(session_token);
CREATE INDEX IF NOT EXISTS login_sessions_expires_at_idx ON login_sessions(expires_at);
CREATE INDEX IF NOT EXISTS login_history_user_id_idx ON login_history(user_id);
CREATE INDEX IF NOT EXISTS login_history_created_at_idx ON login_history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE two_factor_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for two_factor_auth
CREATE POLICY "Users can view their own 2FA settings"
  ON two_factor_auth
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own 2FA settings"
  ON two_factor_auth
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own 2FA settings"
  ON two_factor_auth
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for login_sessions
CREATE POLICY "Users can view their own sessions"
  ON login_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON login_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert sessions"
  ON login_sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update sessions"
  ON login_sessions
  FOR UPDATE
  USING (true);

-- RLS Policies for login_history
CREATE POLICY "Users can view their own login history"
  ON login_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert login history"
  ON login_history
  FOR INSERT
  WITH CHECK (true);

-- Only admins can view all login history
CREATE POLICY "Admins can view all login history"
  ON login_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_two_factor_auth_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER two_factor_auth_updated_at
  BEFORE UPDATE ON two_factor_auth
  FOR EACH ROW
  EXECUTE FUNCTION update_two_factor_auth_updated_at();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM login_sessions
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE two_factor_auth IS 'Two-factor authentication settings for users';
COMMENT ON COLUMN two_factor_auth.secret IS 'TOTP secret key (encrypted)';
COMMENT ON COLUMN two_factor_auth.backup_codes IS 'Array of backup codes for account recovery';
COMMENT ON TABLE login_sessions IS 'Active login sessions with device and location information';
COMMENT ON TABLE login_history IS 'Historical login attempts for security monitoring';

