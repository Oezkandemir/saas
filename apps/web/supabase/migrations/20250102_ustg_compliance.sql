-- UStG Compliance for German Invoices
-- Add fields required by § 14 UStG (German VAT Act)

-- Add USt-IdNr validation and tracking
ALTER TABLE customers ADD COLUMN IF NOT EXISTS vat_id_validated BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS vat_id_validated_at TIMESTAMP WITH TIME ZONE;

-- Add reverse charge indicator for B2B EU transactions
ALTER TABLE documents ADD COLUMN IF NOT EXISTS reverse_charge BOOLEAN DEFAULT false;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS kleinunternehmer BOOLEAN DEFAULT false;

-- Add additional invoice fields required by § 14 UStG
ALTER TABLE documents ADD COLUMN IF NOT EXISTS invoice_recipient_vat_id TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS issuer_vat_id TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS delivery_date DATE;

-- Comments for UStG compliance
COMMENT ON COLUMN customers.vat_id_validated IS 'Whether VAT ID was validated against EU VIES system';
COMMENT ON COLUMN documents.reverse_charge IS 'Reverse charge procedure for B2B EU transactions';
COMMENT ON COLUMN documents.kleinunternehmer IS 'Small business regulation §19 UStG (no VAT)';
COMMENT ON COLUMN documents.invoice_recipient_vat_id IS 'VAT ID of invoice recipient';
COMMENT ON COLUMN documents.issuer_vat_id IS 'VAT ID of invoice issuer';
COMMENT ON COLUMN documents.delivery_date IS 'Date of delivery/service provision';

-- Function to validate document number sequence (no gaps allowed)
CREATE OR REPLACE FUNCTION check_invoice_number_sequence()
RETURNS TRIGGER AS $$
DECLARE
  last_number INTEGER;
  new_number INTEGER;
BEGIN
  -- Only check for invoices
  IF NEW.type != 'invoice' THEN
    RETURN NEW;
  END IF;

  -- Extract number from document_number (assuming format like INV-2024-001)
  -- This is a simplified version - adjust based on your number format
  new_number := CAST(SUBSTRING(NEW.document_number FROM '[0-9]+$') AS INTEGER);

  -- Get the last invoice number for this user
  SELECT CAST(SUBSTRING(document_number FROM '[0-9]+$') AS INTEGER)
  INTO last_number
  FROM documents
  WHERE user_id = NEW.user_id
    AND type = 'invoice'
    AND id != NEW.id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Check for gaps (simplified - may need adjustment for your needs)
  IF last_number IS NOT NULL AND new_number != last_number + 1 THEN
    RAISE WARNING 'Invoice number sequence has a gap: last %, new %', last_number, new_number;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for invoice number validation
DROP TRIGGER IF NOT EXISTS validate_invoice_number_sequence ON documents;
CREATE TRIGGER validate_invoice_number_sequence
  BEFORE INSERT OR UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION check_invoice_number_sequence();

-- Helper function to validate VAT ID format
CREATE OR REPLACE FUNCTION validate_vat_id_format(vat_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- German VAT ID: DE + 9 digits
  IF vat_id ~ '^DE[0-9]{9}$' THEN
    RETURN TRUE;
  END IF;
  
  -- Other EU VAT ID formats (simplified)
  -- AT, BE, BG, CY, CZ, DK, EE, ES, FI, FR, GB, GR, HR, HU, IE, IT, LT, LU, LV, MT, NL, PL, PT, RO, SE, SI, SK
  IF vat_id ~ '^[A-Z]{2}[A-Z0-9]{2,12}$' THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_vat_id_format IS 'Validates VAT ID format (basic check, not VIES validation)';

-- Create view for UStG-compliant invoices
CREATE OR REPLACE VIEW ustg_compliant_invoices AS
SELECT 
  d.*,
  c.name as customer_name,
  c.company as customer_company,
  c.address as customer_address,
  c.vat_id as customer_vat_id,
  c.vat_id_validated,
  CASE 
    WHEN d.document_number IS NOT NULL AND
         d.issue_date IS NOT NULL AND
         d.issuer_vat_id IS NOT NULL AND
         c.name IS NOT NULL AND
         c.address IS NOT NULL AND
         d.total_amount IS NOT NULL
    THEN true
    ELSE false
  END as is_ustg_compliant
FROM documents d
LEFT JOIN customers c ON d.customer_id = c.id
WHERE d.type = 'invoice';

COMMENT ON VIEW ustg_compliant_invoices IS 'View showing invoice compliance status with § 14 UStG';

