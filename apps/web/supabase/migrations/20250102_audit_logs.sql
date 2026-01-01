-- Audit Logs for GDPR Compliance
-- Tracks all critical user actions for compliance and security

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs(action);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs"
  ON audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Anyone can insert audit logs (for system actions)
CREATE POLICY "Allow insert for authenticated users"
  ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Only admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Comments
COMMENT ON TABLE audit_logs IS 'Audit trail for GDPR compliance and security monitoring';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed (e.g., DATA_EXPORT, ACCOUNT_DELETION)';
COMMENT ON COLUMN audit_logs.details IS 'Additional details about the action in JSON format';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address of the user at the time of action';
COMMENT ON COLUMN audit_logs.user_agent IS 'User agent string for audit trail';

-- Example actions to track:
-- DATA_EXPORT, ACCOUNT_DELETION_REQUESTED, ACCOUNT_ANONYMIZED, 
-- LOGIN, LOGOUT, PASSWORD_CHANGE, EMAIL_CHANGE, 
-- DOCUMENT_CREATED, DOCUMENT_DELETED, CUSTOMER_CREATED, etc.

