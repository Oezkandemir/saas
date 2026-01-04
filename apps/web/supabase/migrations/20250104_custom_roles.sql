-- Custom Roles System Migration
-- Extends the simple role enum to a flexible role-based permission system

-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb, -- Object with permission keys and boolean values
  is_system_role BOOLEAN DEFAULT false, -- System roles (ADMIN, USER) cannot be deleted
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles junction table (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS roles_name_idx ON public.roles(name);
CREATE INDEX IF NOT EXISTS roles_is_system_role_idx ON public.roles(is_system_role);
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS user_roles_role_id_idx ON public.user_roles(role_id);

-- Insert default system roles
INSERT INTO public.roles (name, description, permissions, is_system_role)
VALUES 
  ('ADMIN', 'Administrator with full access', '{"*": true}'::jsonb, true),
  ('USER', 'Standard user with basic permissions', '{"documents.read": true, "documents.write": true, "qr_codes.read": true, "qr_codes.write": true, "customers.read": true, "customers.write": true}'::jsonb, true)
ON CONFLICT (name) DO NOTHING;

-- Migrate existing users to use roles
-- Assign ADMIN role to users with role = 'ADMIN'
INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM public.users u
CROSS JOIN public.roles r
WHERE u.role = 'ADMIN'::user_role AND r.name = 'ADMIN'
ON CONFLICT DO NOTHING;

-- Assign USER role to all other users
INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM public.users u
CROSS JOIN public.roles r
WHERE (u.role IS NULL OR u.role = 'USER'::user_role) AND r.name = 'USER'
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roles
-- Everyone can view roles (for permission checks)
DROP POLICY IF EXISTS roles_select_all ON public.roles;
CREATE POLICY roles_select_all ON public.roles
  FOR SELECT
  USING (true);

-- Only admins can insert roles
DROP POLICY IF EXISTS roles_insert_admin ON public.roles;
CREATE POLICY roles_insert_admin ON public.roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Only admins can update roles (but not system roles)
DROP POLICY IF EXISTS roles_update_admin ON public.roles;
CREATE POLICY roles_update_admin ON public.roles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
    AND is_system_role = false -- Prevent modification of system roles
  );

-- Only admins can delete roles (but not system roles)
DROP POLICY IF EXISTS roles_delete_admin ON public.roles;
CREATE POLICY roles_delete_admin ON public.roles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
    AND is_system_role = false -- Prevent deletion of system roles
  );

-- RLS Policies for user_roles
-- Users can view their own roles
DROP POLICY IF EXISTS user_roles_select_own ON public.user_roles;
CREATE POLICY user_roles_select_own ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all user roles
DROP POLICY IF EXISTS user_roles_select_admin ON public.user_roles;
CREATE POLICY user_roles_select_admin ON public.user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Only admins can assign roles
DROP POLICY IF EXISTS user_roles_insert_admin ON public.user_roles;
CREATE POLICY user_roles_insert_admin ON public.user_roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Only admins can remove roles
DROP POLICY IF EXISTS user_roles_delete_admin ON public.user_roles;
CREATE POLICY user_roles_delete_admin ON public.user_roles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Comments for documentation
COMMENT ON TABLE public.roles IS 'Custom roles with flexible permissions';
COMMENT ON COLUMN public.roles.permissions IS 'JSON object with permission keys and boolean values (e.g., {"documents.read": true, "documents.write": true})';
COMMENT ON COLUMN public.roles.is_system_role IS 'System roles (ADMIN, USER) cannot be deleted or modified';
COMMENT ON TABLE public.user_roles IS 'Many-to-Many relationship between users and roles';













