-- Cookie Consent Tracking
-- Stores user cookie consent choices for GDPR compliance

CREATE TABLE IF NOT EXISTS cookie_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  necessary BOOLEAN NOT NULL DEFAULT true,
  analytics BOOLEAN NOT NULL DEFAULT false,
  marketing BOOLEAN NOT NULL DEFAULT false,
  consent_version TEXT NOT NULL DEFAULT '1.0',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS cookie_consents_user_id_idx ON cookie_consents(user_id);
CREATE INDEX IF NOT EXISTS cookie_consents_created_at_idx ON cookie_consents(created_at DESC);

-- Enable Row Level Security
ALTER TABLE cookie_consents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own cookie consents"
  ON cookie_consents
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cookie consents"
  ON cookie_consents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cookie consents"
  ON cookie_consents
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_cookie_consents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cookie_consents_updated_at
  BEFORE UPDATE ON cookie_consents
  FOR EACH ROW
  EXECUTE FUNCTION update_cookie_consents_updated_at();

-- Comments
COMMENT ON TABLE cookie_consents IS 'Stores user cookie consent choices for GDPR compliance';
COMMENT ON COLUMN cookie_consents.necessary IS 'Always true - required cookies';
COMMENT ON COLUMN cookie_consents.analytics IS 'User consent for analytics cookies';
COMMENT ON COLUMN cookie_consents.marketing IS 'User consent for marketing cookies';
COMMENT ON COLUMN cookie_consents.consent_version IS 'Version of consent terms';
COMMENT ON COLUMN cookie_consents.ip_address IS 'IP address for audit trail';
COMMENT ON COLUMN cookie_consents.user_agent IS 'User agent for audit trail';

