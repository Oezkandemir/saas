-- Document Templates Migration
-- Creates table for storing invoice/quote templates with branding

CREATE TABLE IF NOT EXISTS public.document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type document_type NOT NULL DEFAULT 'invoice',
  is_default BOOLEAN DEFAULT false,
  
  -- Company/Branding Info
  company_name TEXT,
  company_address TEXT,
  company_city TEXT,
  company_postal_code TEXT,
  company_country TEXT DEFAULT 'DE',
  company_tax_id TEXT,
  company_email TEXT,
  company_phone TEXT,
  company_website TEXT,
  company_iban TEXT,
  company_bic TEXT,
  company_bank_name TEXT,
  
  -- Design Settings
  logo_url TEXT,
  primary_color TEXT DEFAULT '#000000',
  secondary_color TEXT DEFAULT '#666666',
  font_family TEXT DEFAULT 'Arial, sans-serif',
  
  -- Template Configuration
  show_logo BOOLEAN DEFAULT false,
  show_payment_info BOOLEAN DEFAULT true,
  show_footer BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, name, type)
);

CREATE INDEX IF NOT EXISTS document_templates_user_id_idx ON public.document_templates(user_id);
CREATE INDEX IF NOT EXISTS document_templates_type_idx ON public.document_templates(type);
CREATE INDEX IF NOT EXISTS document_templates_is_default_idx ON public.document_templates(is_default);

-- RLS Policies
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own templates"
  ON public.document_templates
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
  ON public.document_templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON public.document_templates
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON public.document_templates
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_document_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_document_templates_updated_at
  BEFORE UPDATE ON public.document_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_document_templates_updated_at();

-- Add template_id to documents table
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.document_templates(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS documents_template_id_idx ON public.documents(template_id);






