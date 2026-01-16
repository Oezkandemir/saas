-- Create Settings Table for Admin System Settings
-- This table stores system-wide configuration settings

CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  category TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on key for fast lookups
CREATE INDEX IF NOT EXISTS settings_key_idx ON public.settings(key);
CREATE INDEX IF NOT EXISTS settings_category_idx ON public.settings(category);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can read and write settings
CREATE POLICY "Admins can view all settings"
  ON public.settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can insert settings"
  ON public.settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can update settings"
  ON public.settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can delete settings"
  ON public.settings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_updated_at();

-- Insert default notification settings if they don't exist
INSERT INTO public.settings (key, value, description, category)
VALUES 
  ('notifications.enabled', 'true', 'Enable system-wide notifications', 'notifications'),
  ('notifications.email_enabled', 'true', 'Enable email notifications', 'notifications'),
  ('notifications.push_enabled', 'false', 'Enable browser push notifications', 'notifications'),
  ('notifications.in_app_enabled', 'true', 'Enable in-app notification center', 'notifications')
ON CONFLICT (key) DO NOTHING;

-- Comments
COMMENT ON TABLE public.settings IS 'System-wide configuration settings for the admin panel';
COMMENT ON COLUMN public.settings.key IS 'Unique setting key identifier';
COMMENT ON COLUMN public.settings.value IS 'Setting value as text';
COMMENT ON COLUMN public.settings.description IS 'Human-readable description of the setting';
COMMENT ON COLUMN public.settings.category IS 'Category grouping for settings (e.g., notifications, appearance, security)';
