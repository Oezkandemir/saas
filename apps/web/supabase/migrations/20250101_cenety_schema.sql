-- Cenety Database Schema Migration
-- Creates tables for: customers, documents, document_items, qr_codes, qr_events, subscriptions

-- ============================================
-- CUSTOMERS TABLE (CRM Light)
-- ============================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'DE',
  tax_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS customers_user_id_idx ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS customers_email_idx ON public.customers(email);

-- ============================================
-- DOCUMENTS TABLE (Quotes & Invoices)
-- ============================================
CREATE TYPE document_type AS ENUM ('quote', 'invoice');
CREATE TYPE document_status AS ENUM ('draft', 'sent', 'accepted', 'declined', 'paid', 'overdue');

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  document_number TEXT NOT NULL,
  type document_type NOT NULL,
  status document_status DEFAULT 'draft',
  document_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  tax_rate DECIMAL(5,2) DEFAULT 19.00,
  subtotal DECIMAL(10,2) DEFAULT 0.00,
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  total DECIMAL(10,2) DEFAULT 0.00,
  notes TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, document_number, type)
);

CREATE INDEX IF NOT EXISTS documents_user_id_idx ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS documents_customer_id_idx ON public.documents(customer_id);
CREATE INDEX IF NOT EXISTS documents_document_number_idx ON public.documents(document_number);
CREATE INDEX IF NOT EXISTS documents_type_idx ON public.documents(type);
CREATE INDEX IF NOT EXISTS documents_status_idx ON public.documents(status);

-- ============================================
-- DOCUMENT ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.document_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1.00,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS document_items_document_id_idx ON public.document_items(document_id);

-- ============================================
-- QR CODES TABLE
-- ============================================
CREATE TYPE qr_code_type AS ENUM ('url', 'pdf', 'text', 'whatsapp', 'maps');

CREATE TABLE IF NOT EXISTS public.qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type qr_code_type NOT NULL DEFAULT 'url',
  destination TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS qr_codes_user_id_idx ON public.qr_codes(user_id);
CREATE INDEX IF NOT EXISTS qr_codes_code_idx ON public.qr_codes(code);
CREATE UNIQUE INDEX IF NOT EXISTS qr_codes_code_unique_idx ON public.qr_codes(code);

-- ============================================
-- QR EVENTS TABLE (Scan Tracking - Pro only)
-- ============================================
CREATE TABLE IF NOT EXISTS public.qr_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id UUID NOT NULL REFERENCES public.qr_codes(id) ON DELETE CASCADE,
  user_agent TEXT,
  referrer TEXT,
  country TEXT,
  ip_address TEXT,
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS qr_events_qr_code_id_idx ON public.qr_events(qr_code_id);
CREATE INDEX IF NOT EXISTS qr_events_scanned_at_idx ON public.qr_events(scanned_at);

-- ============================================
-- SUBSCRIPTIONS TABLE (Enhanced Stripe integration)
-- ============================================
CREATE TYPE subscription_plan AS ENUM ('free', 'starter', 'pro');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');

-- Note: This extends the existing users table with subscription info
-- We'll add a subscriptions table for better tracking
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_price_id TEXT,
  plan subscription_plan DEFAULT 'free',
  status subscription_status DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_idx ON public.subscriptions(stripe_subscription_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- CUSTOMERS POLICIES
DROP POLICY IF EXISTS customers_select_own ON public.customers;
CREATE POLICY customers_select_own ON public.customers
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS customers_insert_own ON public.customers;
CREATE POLICY customers_insert_own ON public.customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS customers_update_own ON public.customers;
CREATE POLICY customers_update_own ON public.customers
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS customers_delete_own ON public.customers;
CREATE POLICY customers_delete_own ON public.customers
  FOR DELETE USING (auth.uid() = user_id);

-- DOCUMENTS POLICIES
DROP POLICY IF EXISTS documents_select_own ON public.documents;
CREATE POLICY documents_select_own ON public.documents
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS documents_insert_own ON public.documents;
CREATE POLICY documents_insert_own ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS documents_update_own ON public.documents;
CREATE POLICY documents_update_own ON public.documents
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS documents_delete_own ON public.documents;
CREATE POLICY documents_delete_own ON public.documents
  FOR DELETE USING (auth.uid() = user_id);

-- DOCUMENT ITEMS POLICIES (via document ownership)
DROP POLICY IF EXISTS document_items_select_own ON public.document_items;
CREATE POLICY document_items_select_own ON public.document_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = document_items.document_id
      AND documents.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS document_items_insert_own ON public.document_items;
CREATE POLICY document_items_insert_own ON public.document_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = document_items.document_id
      AND documents.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS document_items_update_own ON public.document_items;
CREATE POLICY document_items_update_own ON public.document_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = document_items.document_id
      AND documents.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS document_items_delete_own ON public.document_items;
CREATE POLICY document_items_delete_own ON public.document_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = document_items.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- QR CODES POLICIES
DROP POLICY IF EXISTS qr_codes_select_own ON public.qr_codes;
CREATE POLICY qr_codes_select_own ON public.qr_codes
  FOR SELECT USING (auth.uid() = user_id);

-- Public read access for QR code redirects (by code only)
DROP POLICY IF EXISTS qr_codes_select_public ON public.qr_codes;
CREATE POLICY qr_codes_select_public ON public.qr_codes
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS qr_codes_insert_own ON public.qr_codes;
CREATE POLICY qr_codes_insert_own ON public.qr_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS qr_codes_update_own ON public.qr_codes;
CREATE POLICY qr_codes_update_own ON public.qr_codes
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS qr_codes_delete_own ON public.qr_codes;
CREATE POLICY qr_codes_delete_own ON public.qr_codes
  FOR DELETE USING (auth.uid() = user_id);

-- QR EVENTS POLICIES (via qr_code ownership)
DROP POLICY IF EXISTS qr_events_select_own ON public.qr_events;
CREATE POLICY qr_events_select_own ON public.qr_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.qr_codes
      WHERE qr_codes.id = qr_events.qr_code_id
      AND qr_codes.user_id = auth.uid()
    )
  );

-- Public insert for scan tracking (anyone can log a scan)
DROP POLICY IF EXISTS qr_events_insert_public ON public.qr_events;
CREATE POLICY qr_events_insert_public ON public.qr_events
  FOR INSERT WITH CHECK (true);

-- SUBSCRIPTIONS POLICIES
DROP POLICY IF EXISTS subscriptions_select_own ON public.subscriptions;
CREATE POLICY subscriptions_select_own ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS subscriptions_insert_own ON public.subscriptions;
CREATE POLICY subscriptions_insert_own ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS subscriptions_update_own ON public.subscriptions;
CREATE POLICY subscriptions_update_own ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get next document number
CREATE OR REPLACE FUNCTION public.get_next_document_number(
  p_user_id UUID,
  p_type document_type
)
RETURNS TEXT AS $$
DECLARE
  v_max_number INTEGER;
  v_prefix TEXT;
BEGIN
  v_prefix := CASE WHEN p_type = 'quote' THEN 'A' ELSE 'R' END;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(document_number FROM '[0-9]+') AS INTEGER)), 1000)
  INTO v_max_number
  FROM public.documents
  WHERE user_id = p_user_id
  AND type = p_type
  AND document_number ~ ('^' || v_prefix || '[0-9]+$');
  
  RETURN v_prefix || LPAD((v_max_number + 1)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate unique QR code
CREATE OR REPLACE FUNCTION public.generate_qr_code()
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 8-character alphanumeric code
    v_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
    
    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM public.qr_codes WHERE code = v_code) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Function to update document totals
CREATE OR REPLACE FUNCTION public.update_document_totals(p_document_id UUID)
RETURNS VOID AS $$
DECLARE
  v_subtotal DECIMAL(10,2);
  v_tax_rate DECIMAL(5,2);
  v_tax_amount DECIMAL(10,2);
  v_total DECIMAL(10,2);
BEGIN
  -- Calculate subtotal from items
  SELECT COALESCE(SUM(total), 0.00)
  INTO v_subtotal
  FROM public.document_items
  WHERE document_id = p_document_id;
  
  -- Get tax rate from document
  SELECT tax_rate INTO v_tax_rate
  FROM public.documents
  WHERE id = p_document_id;
  
  -- Calculate tax and total
  v_tax_amount := ROUND(v_subtotal * (v_tax_rate / 100), 2);
  v_total := v_subtotal + v_tax_amount;
  
  -- Update document
  UPDATE public.documents
  SET 
    subtotal = v_subtotal,
    tax_amount = v_tax_amount,
    total = v_total,
    updated_at = NOW()
  WHERE id = p_document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update document totals when items change
CREATE OR REPLACE FUNCTION public.trigger_update_document_totals()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.update_document_totals(
    COALESCE(NEW.document_id, OLD.document_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS document_items_update_totals ON public.document_items;
CREATE TRIGGER document_items_update_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.document_items
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_document_totals();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS customers_updated_at ON public.customers;
CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS documents_updated_at ON public.documents;
CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS qr_codes_updated_at ON public.qr_codes;
CREATE TRIGGER qr_codes_updated_at
  BEFORE UPDATE ON public.qr_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();















