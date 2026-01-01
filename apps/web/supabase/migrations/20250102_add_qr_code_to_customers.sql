-- Add QR code field to customers table
-- This allows each customer to have a unique QR code for easy access
-- Note: QR codes are generated in the application code for better performance and reliability

ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS qr_code TEXT;

CREATE INDEX IF NOT EXISTS customers_qr_code_idx ON public.customers(qr_code);

-- Optional: Function to generate a unique QR code for customers
-- This function is optional - the application generates QR codes directly for better performance
-- Uncomment if you want to use database-generated QR codes instead
/*
CREATE OR REPLACE FUNCTION generate_customer_qr_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 8-character alphanumeric code
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.customers WHERE qr_code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;
*/

