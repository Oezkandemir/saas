-- Query Optimization Migration
-- Adds composite indexes for common query patterns to improve performance
-- Date: 2025-01-16

-- ============================================
-- DOCUMENTS TABLE OPTIMIZATIONS
-- ============================================

-- Composite index for user_id + type + created_at (most common query pattern)
-- Used in: getDocuments() with type filter, sorted by created_at DESC
CREATE INDEX IF NOT EXISTS documents_user_type_created_idx 
ON public.documents(user_id, type, created_at DESC);

-- Composite index for user_id + company_profile_id + created_at
-- Used in: getDocuments() with companyProfileId filter
CREATE INDEX IF NOT EXISTS documents_user_company_created_idx 
ON public.documents(user_id, company_profile_id, created_at DESC) 
WHERE company_profile_id IS NOT NULL;

-- Composite index for user_id + customer_id + created_at
-- Used in: getDocuments() with customerId filter
CREATE INDEX IF NOT EXISTS documents_user_customer_created_idx 
ON public.documents(user_id, customer_id, created_at DESC) 
WHERE customer_id IS NOT NULL;

-- Composite index for user_id + status + document_date
-- Used in: Document filtering by status and date
CREATE INDEX IF NOT EXISTS documents_user_status_date_idx 
ON public.documents(user_id, status, document_date DESC);

-- ============================================
-- BOOKINGS TABLE OPTIMIZATIONS
-- ============================================

-- Composite index for host_user_id + status + start_at
-- Used in: listBookings() with status filter, sorted by start_at
CREATE INDEX IF NOT EXISTS bookings_host_status_start_idx 
ON public.bookings(host_user_id, status, start_at ASC);

-- Composite index for event_type_id + status + start_at
-- Used in: listBookings() with event_type_id filter
CREATE INDEX IF NOT EXISTS bookings_event_status_start_idx 
ON public.bookings(event_type_id, status, start_at ASC);

-- Partial index for active bookings date range queries
-- Used in: Availability checks for scheduled bookings
CREATE INDEX IF NOT EXISTS bookings_active_date_range_idx 
ON public.bookings(start_at, end_at) 
WHERE status = 'scheduled';

-- Composite index for company_profile_id + status + start_at
-- Used in: Bookings filtered by company profile
CREATE INDEX IF NOT EXISTS bookings_company_status_start_idx 
ON public.bookings(company_profile_id, status, start_at ASC) 
WHERE company_profile_id IS NOT NULL;

-- ============================================
-- INBOUND EMAILS TABLE OPTIMIZATIONS
-- ============================================

-- Composite index for is_read + received_at
-- Used in: getInboundEmails() with read/unread filter, sorted by received_at DESC
CREATE INDEX IF NOT EXISTS inbound_emails_read_received_idx 
ON public.inbound_emails(is_read, received_at DESC);

-- Partial index for unread emails (most common query)
CREATE INDEX IF NOT EXISTS inbound_emails_unread_received_idx 
ON public.inbound_emails(received_at DESC) 
WHERE is_read = false;

-- ============================================
-- USERS TABLE OPTIMIZATIONS
-- ============================================

-- Composite index for role + created_at
-- Used in: User search with role filter, sorted by created_at
CREATE INDEX IF NOT EXISTS users_role_created_idx 
ON public.users(role, created_at DESC) 
WHERE role IS NOT NULL;

-- Enable pg_trgm extension for trigram matching (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN index for full-text search on name and email
-- Used in: User search with ILIKE queries on name and email
-- Note: This index helps with ILIKE queries but may not be used for all patterns
-- Consider using separate indexes if performance is still an issue
CREATE INDEX IF NOT EXISTS users_name_gin_idx 
ON public.users USING gin(name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS users_email_gin_idx 
ON public.users USING gin(email gin_trgm_ops);

-- ============================================
-- CUSTOMERS TABLE OPTIMIZATIONS
-- ============================================

-- Composite index for user_id + company_profile_id
-- Used in: getCustomers() with companyProfileId filter
CREATE INDEX IF NOT EXISTS customers_user_company_idx 
ON public.customers(user_id, company_profile_id) 
WHERE company_profile_id IS NOT NULL;

-- ============================================
-- PAGE VIEWS TABLE OPTIMIZATIONS
-- ============================================

-- Composite index for page_path + created_at
-- Used in: Analytics queries sorted by created_at DESC
CREATE INDEX IF NOT EXISTS page_views_path_created_idx 
ON public.page_views(page_path, created_at DESC);

-- Partial index for recent page views (last 30 days)
-- Used in: Recent analytics queries
CREATE INDEX IF NOT EXISTS page_views_recent_idx 
ON public.page_views(page_path, created_at DESC) 
WHERE created_at > NOW() - INTERVAL '30 days';

-- ============================================
-- FEATURE USAGE TABLE OPTIMIZATIONS
-- ============================================

-- Composite index for user_id + feature_name + created_at
-- Used in: Feature usage analytics queries
CREATE INDEX IF NOT EXISTS feature_usage_user_feature_date_idx 
ON public.feature_usage(user_id, feature_name, created_at DESC);

-- ============================================
-- SUPPORT TICKETS TABLE OPTIMIZATIONS
-- ============================================

-- Composite index for user_id + status + created_at
-- Used in: Ticket queries filtered by status, sorted by created_at
CREATE INDEX IF NOT EXISTS support_tickets_user_status_created_idx 
ON public.support_tickets(user_id, status, created_at DESC);

-- Composite index for assigned_to + status + created_at
-- Used in: Admin ticket queries filtered by assignee
CREATE INDEX IF NOT EXISTS support_tickets_assigned_status_created_idx 
ON public.support_tickets(assigned_to, status, created_at DESC) 
WHERE assigned_to IS NOT NULL;

-- ============================================
-- QR CODES TABLE OPTIMIZATIONS
-- ============================================

-- Composite index for user_id + is_active + created_at
-- Used in: QR code queries filtered by active status
CREATE INDEX IF NOT EXISTS qr_codes_user_active_created_idx 
ON public.qr_codes(user_id, is_active, created_at DESC);

-- ============================================
-- ANALYZE TABLES
-- ============================================

-- Update table statistics for query planner
ANALYZE public.documents;
ANALYZE public.bookings;
ANALYZE public.inbound_emails;
ANALYZE public.users;
ANALYZE public.customers;
ANALYZE public.page_views;
ANALYZE public.feature_usage;
ANALYZE public.support_tickets;
ANALYZE public.qr_codes;

-- Comments for documentation
COMMENT ON INDEX public.documents_user_type_created_idx IS 'Optimizes queries filtering documents by user_id, type, and sorting by created_at';
COMMENT ON INDEX public.bookings_host_status_start_idx IS 'Optimizes queries filtering bookings by host_user_id, status, and sorting by start_at';
COMMENT ON INDEX public.inbound_emails_read_received_idx IS 'Optimizes queries filtering emails by read status and sorting by received_at';
COMMENT ON INDEX public.users_role_created_idx IS 'Optimizes user search queries filtering by role and sorting by created_at';
