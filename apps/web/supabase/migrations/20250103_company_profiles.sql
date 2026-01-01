-- Company Profiles Migration
-- Creates centralized table for company information that can be reused across features
-- Supports both user-specific and team-specific profiles

-- Create profile_type enum
DO $$ BEGIN
  CREATE TYPE profile_type AS ENUM ('personal', 'team');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create company_profiles table
CREATE TABLE IF NOT EXISTS public.company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership (user_id required, team_id optional for future team support)
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Profile metadata
  profile_name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  profile_type profile_type NOT NULL DEFAULT 'personal',
  
  -- Basic company information
  company_name TEXT NOT NULL,
  company_address TEXT,
  company_address_line2 TEXT,
  company_postal_code TEXT,
  company_city TEXT,
  company_country TEXT DEFAULT 'DE',
  
  -- Legal information
  company_tax_id TEXT, -- Steuernummer
  company_vat_id TEXT, -- USt-IdNr
  company_registration_number TEXT, -- Handelsregisternummer
  
  -- Contact information
  company_email TEXT NOT NULL,
  company_phone TEXT,
  company_mobile TEXT,
  company_website TEXT,
  contact_person_name TEXT,
  contact_person_position TEXT,
  
  -- Bank information
  bank_name TEXT,
  bank_account_holder TEXT,
  iban TEXT,
  bic TEXT,
  
  -- Branding (optional)
  logo_url TEXT,
  primary_color TEXT DEFAULT '#000000',
  secondary_color TEXT DEFAULT '#666666',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  -- Profile name must be unique per user
  CONSTRAINT unique_user_profile_name UNIQUE (user_id, profile_name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS company_profiles_user_id_idx ON public.company_profiles(user_id);
CREATE INDEX IF NOT EXISTS company_profiles_is_default_idx ON public.company_profiles(is_default);
CREATE INDEX IF NOT EXISTS company_profiles_profile_type_idx ON public.company_profiles(profile_type);

-- RLS Policies
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profiles
CREATE POLICY "Users can view their own profiles"
  ON public.company_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own profiles
CREATE POLICY "Users can create their own profiles"
  ON public.company_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profiles
CREATE POLICY "Users can update their own profiles"
  ON public.company_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own profiles
CREATE POLICY "Users can delete their own profiles"
  ON public.company_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_company_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_profiles_updated_at
  BEFORE UPDATE ON public.company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_company_profiles_updated_at();

-- Add company_profile_id to document_templates for future reference
ALTER TABLE public.document_templates
  ADD COLUMN IF NOT EXISTS company_profile_id UUID REFERENCES public.company_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS document_templates_company_profile_id_idx 
  ON public.document_templates(company_profile_id);

-- Add company_profile_id to documents for tracking which profile was used
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS company_profile_id UUID REFERENCES public.company_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS documents_company_profile_id_idx 
  ON public.documents(company_profile_id);

-- Add company_profile_id to invoices for tracking which profile was used
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS company_profile_id UUID REFERENCES public.company_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS invoices_company_profile_id_idx 
  ON public.invoices(company_profile_id);

