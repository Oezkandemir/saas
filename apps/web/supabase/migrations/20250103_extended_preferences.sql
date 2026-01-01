-- Extended User Preferences Migration
-- Adds granular notification preferences, locale settings, and format preferences

-- Add new columns to user_profiles table for extended preferences
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS date_format TEXT DEFAULT 'DD.MM.YYYY',
ADD COLUMN IF NOT EXISTS time_format TEXT DEFAULT '24h',
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR',
ADD COLUMN IF NOT EXISTS number_format TEXT DEFAULT 'european',
ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'de-DE',
ADD COLUMN IF NOT EXISTS email_digest_frequency TEXT DEFAULT 'daily',
ADD COLUMN IF NOT EXISTS notification_preferences_granular JSONB DEFAULT '{
  "email": {
    "system": true,
    "billing": true,
    "security": true,
    "marketing": false,
    "support": true,
    "newsletter": false
  },
  "push": {
    "system": true,
    "billing": true,
    "security": true,
    "marketing": false,
    "support": true,
    "newsletter": false
  },
  "in_app": {
    "system": true,
    "billing": true,
    "security": true,
    "marketing": false,
    "support": true,
    "newsletter": false
  }
}'::jsonb;

-- Create index for locale lookups
CREATE INDEX IF NOT EXISTS user_profiles_locale_idx ON public.user_profiles(locale);

-- Comments for documentation
COMMENT ON COLUMN public.user_profiles.date_format IS 'Date format preference (DD.MM.YYYY, MM/DD/YYYY, YYYY-MM-DD, etc.)';
COMMENT ON COLUMN public.user_profiles.time_format IS 'Time format preference (12h or 24h)';
COMMENT ON COLUMN public.user_profiles.timezone IS 'User timezone (e.g., Europe/Berlin, America/New_York)';
COMMENT ON COLUMN public.user_profiles.currency IS 'Preferred currency code (EUR, USD, GBP, etc.)';
COMMENT ON COLUMN public.user_profiles.number_format IS 'Number format preference (european: 1.234,56 or american: 1,234.56)';
COMMENT ON COLUMN public.user_profiles.locale IS 'Locale preference (de-DE, en-US, etc.)';
COMMENT ON COLUMN public.user_profiles.email_digest_frequency IS 'Email digest frequency (never, daily, weekly, monthly)';
COMMENT ON COLUMN public.user_profiles.notification_preferences_granular IS 'Granular notification preferences by channel and type';

