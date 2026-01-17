-- Add public RLS policy for QR code access to customers table
-- This allows anyone (including unauthenticated users) to access customer data via QR code
-- This is necessary for QR codes to work when scanned by external users

-- Policy to allow public SELECT access to customers via QR code
-- This policy works alongside the existing customers_select_own policy
-- Supabase uses OR logic for multiple SELECT policies, so users can access:
-- 1. Their own customers (via customers_select_own)
-- 2. Any customer with a QR code (via this policy)
DROP POLICY IF EXISTS customers_select_by_qr_code ON public.customers;
CREATE POLICY customers_select_by_qr_code ON public.customers
  FOR SELECT 
  USING (qr_code IS NOT NULL);

