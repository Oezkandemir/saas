-- Enhance audit_logs table with resource tracking
-- Adds resource_type and resource_id columns for better activity tracking

-- Add resource_type column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' AND column_name = 'resource_type'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN resource_type TEXT;
  END IF;
END $$;

-- Add resource_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' AND column_name = 'resource_id'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN resource_id UUID;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS audit_logs_resource_type_idx ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS audit_logs_resource_id_idx ON audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS audit_logs_resource_composite_idx ON audit_logs(resource_type, resource_id);

-- Update RLS policy to use ADMIN role (uppercase)
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Comments
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource affected (e.g., user, document, customer, subscription)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the resource affected by this action';
