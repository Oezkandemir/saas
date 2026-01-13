-- Resource Permissions Migration
-- Fine-grained permissions for sharing documents, QR codes, and customers

-- Create resource_type enum
DO $$ BEGIN
  CREATE TYPE resource_type AS ENUM ('document', 'qr_code', 'customer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create permission_level enum
DO $$ BEGIN
  CREATE TYPE permission_level AS ENUM ('read', 'write', 'delete');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create resource_permissions table
CREATE TABLE IF NOT EXISTS public.resource_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type resource_type NOT NULL,
  resource_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  permission_level permission_level NOT NULL DEFAULT 'read',
  granted_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure unique permission per resource/user combination
  UNIQUE(resource_type, resource_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS resource_permissions_resource_idx ON public.resource_permissions(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS resource_permissions_user_id_idx ON public.resource_permissions(user_id);
CREATE INDEX IF NOT EXISTS resource_permissions_granted_by_idx ON public.resource_permissions(granted_by);

-- Enable Row Level Security
ALTER TABLE public.resource_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view permissions for resources they own or have been granted access to
DROP POLICY IF EXISTS resource_permissions_select_own ON public.resource_permissions;
CREATE POLICY resource_permissions_select_own ON public.resource_permissions
  FOR SELECT
  USING (
    auth.uid() = user_id -- User can see permissions granted to them
    OR EXISTS (
      -- User owns the resource
      SELECT 1 FROM public.documents d
      WHERE d.id::text = resource_permissions.resource_id::text
      AND resource_permissions.resource_type = 'document'
      AND d.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.qr_codes q
      WHERE q.id::text = resource_permissions.resource_id::text
      AND resource_permissions.resource_type = 'qr_code'
      AND q.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id::text = resource_permissions.resource_id::text
      AND resource_permissions.resource_type = 'customer'
      AND c.user_id = auth.uid()
    )
    OR EXISTS (
      -- Admins can see all permissions
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Users can grant permissions for resources they own
DROP POLICY IF EXISTS resource_permissions_insert_owner ON public.resource_permissions;
CREATE POLICY resource_permissions_insert_owner ON public.resource_permissions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id::text = resource_permissions.resource_id::text
      AND resource_permissions.resource_type = 'document'
      AND d.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.qr_codes q
      WHERE q.id::text = resource_permissions.resource_id::text
      AND resource_permissions.resource_type = 'qr_code'
      AND q.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id::text = resource_permissions.resource_id::text
      AND resource_permissions.resource_type = 'customer'
      AND c.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Users can update permissions for resources they own
DROP POLICY IF EXISTS resource_permissions_update_owner ON public.resource_permissions;
CREATE POLICY resource_permissions_update_owner ON public.resource_permissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id::text = resource_permissions.resource_id::text
      AND resource_permissions.resource_type = 'document'
      AND d.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.qr_codes q
      WHERE q.id::text = resource_permissions.resource_id::text
      AND resource_permissions.resource_type = 'qr_code'
      AND q.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id::text = resource_permissions.resource_id::text
      AND resource_permissions.resource_type = 'customer'
      AND c.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Users can revoke permissions for resources they own
DROP POLICY IF EXISTS resource_permissions_delete_owner ON public.resource_permissions;
CREATE POLICY resource_permissions_delete_owner ON public.resource_permissions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id::text = resource_permissions.resource_id::text
      AND resource_permissions.resource_type = 'document'
      AND d.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.qr_codes q
      WHERE q.id::text = resource_permissions.resource_id::text
      AND resource_permissions.resource_type = 'qr_code'
      AND q.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id::text = resource_permissions.resource_id::text
      AND resource_permissions.resource_type = 'customer'
      AND c.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Comments for documentation
COMMENT ON TABLE public.resource_permissions IS 'Fine-grained permissions for sharing resources between users';
COMMENT ON COLUMN public.resource_permissions.resource_type IS 'Type of resource (document, qr_code, customer)';
COMMENT ON COLUMN public.resource_permissions.resource_id IS 'UUID of the resource';
COMMENT ON COLUMN public.resource_permissions.permission_level IS 'Level of access (read, write, delete)';
COMMENT ON COLUMN public.resource_permissions.granted_by IS 'User who granted this permission';






















