-- Cleanup Unused Tables Migration
-- Removes all tables that are not used in the codebase
-- Based on codebase analysis, these tables have no references in the application code

-- ============================================
-- STEP 1: Drop Foreign Key Constraints
-- ============================================

-- Drop FKs from collaboration-related tables
ALTER TABLE IF EXISTS ai_assistant_sessions DROP CONSTRAINT IF EXISTS ai_assistant_sessions_collaboration_session_id_fkey;
ALTER TABLE IF EXISTS avatar_presence DROP CONSTRAINT IF EXISTS avatar_presence_session_id_fkey;
ALTER TABLE IF EXISTS code_intelligence DROP CONSTRAINT IF EXISTS code_intelligence_session_id_fkey;
ALTER TABLE IF EXISTS collaboration_analytics DROP CONSTRAINT IF EXISTS collaboration_analytics_session_id_fkey;
ALTER TABLE IF EXISTS file_operations DROP CONSTRAINT IF EXISTS file_operations_session_id_fkey;
ALTER TABLE IF EXISTS file_operations DROP CONSTRAINT IF EXISTS file_operations_user_id_fkey;
ALTER TABLE IF EXISTS file_sync_operations DROP CONSTRAINT IF EXISTS file_sync_operations_session_id_fkey;
ALTER TABLE IF EXISTS live_cursors DROP CONSTRAINT IF EXISTS live_cursors_session_id_fkey;
ALTER TABLE IF EXISTS live_cursors DROP CONSTRAINT IF EXISTS live_cursors_user_id_fkey;
ALTER TABLE IF EXISTS session_messages DROP CONSTRAINT IF EXISTS session_messages_session_id_fkey;
ALTER TABLE IF EXISTS session_messages DROP CONSTRAINT IF EXISTS session_messages_reply_to_id_fkey;
ALTER TABLE IF EXISTS session_participants DROP CONSTRAINT IF EXISTS session_participants_session_id_fkey;
ALTER TABLE IF EXISTS session_participants DROP CONSTRAINT IF EXISTS session_participants_user_id_fkey;
ALTER TABLE IF EXISTS voice_video_sessions DROP CONSTRAINT IF EXISTS voice_video_sessions_collaboration_session_id_fkey;
ALTER TABLE IF EXISTS collaboration_sessions DROP CONSTRAINT IF EXISTS collaboration_sessions_host_user_id_fkey;
ALTER TABLE IF EXISTS code_review_sessions DROP CONSTRAINT IF EXISTS code_review_sessions_author_id_fkey;

-- Drop FKs from social media tables
ALTER TABLE IF EXISTS likes DROP CONSTRAINT IF EXISTS likes_post_id_fkey;
ALTER TABLE IF EXISTS likes DROP CONSTRAINT IF EXISTS likes_user_id_fkey;
ALTER TABLE IF EXISTS posts DROP CONSTRAINT IF EXISTS posts_parent_id_fkey;
ALTER TABLE IF EXISTS posts DROP CONSTRAINT IF EXISTS posts_user_id_fkey;
ALTER TABLE IF EXISTS follows DROP CONSTRAINT IF EXISTS follows_follower_id_fkey;
ALTER TABLE IF EXISTS follows DROP CONSTRAINT IF EXISTS follows_following_id_fkey;

-- Drop FKs from developer marketplace tables
ALTER TABLE IF EXISTS project_messages DROP CONSTRAINT IF EXISTS project_messages_project_id_fkey;
ALTER TABLE IF EXISTS project_messages DROP CONSTRAINT IF EXISTS project_messages_sender_id_fkey;
ALTER TABLE IF EXISTS quotes DROP CONSTRAINT IF EXISTS quotes_project_id_fkey;
ALTER TABLE IF EXISTS quotes DROP CONSTRAINT IF EXISTS quotes_developer_id_fkey;
ALTER TABLE IF EXISTS projects DROP CONSTRAINT IF EXISTS projects_service_package_id_fkey;
ALTER TABLE IF EXISTS projects DROP CONSTRAINT IF EXISTS projects_developer_id_fkey;
ALTER TABLE IF EXISTS projects DROP CONSTRAINT IF EXISTS projects_customer_id_fkey;
ALTER TABLE IF EXISTS services DROP CONSTRAINT IF EXISTS services_developer_id_fkey;

-- Drop FKs from alternative invoice system tables
ALTER TABLE IF EXISTS invoice_items DROP CONSTRAINT IF EXISTS invoice_items_invoice_id_fkey;
ALTER TABLE IF EXISTS payment_records DROP CONSTRAINT IF EXISTS payment_records_invoice_id_fkey;
ALTER TABLE IF EXISTS invoices DROP CONSTRAINT IF EXISTS invoices_client_id_fkey;
ALTER TABLE IF EXISTS invoices DROP CONSTRAINT IF EXISTS invoices_user_id_fkey;
ALTER TABLE IF EXISTS invoices DROP CONSTRAINT IF EXISTS invoices_company_profile_id_fkey;
ALTER TABLE IF EXISTS clients DROP CONSTRAINT IF EXISTS clients_user_id_fkey;

-- Drop FKs from duplicate/alternative tables
ALTER TABLE IF EXISTS tickets DROP CONSTRAINT IF EXISTS tickets_user_id_fkey;
ALTER TABLE IF EXISTS tickets DROP CONSTRAINT IF EXISTS tickets_assigned_to_fkey;
ALTER TABLE IF EXISTS auth_events DROP CONSTRAINT IF EXISTS auth_events_user_id_fkey;
ALTER TABLE IF EXISTS user_sessions DROP CONSTRAINT IF EXISTS user_sessions_user_id_fkey;
ALTER TABLE IF EXISTS user_activity_logs DROP CONSTRAINT IF EXISTS user_activity_logs_user_id_fkey;

-- Drop FKs from push notification tables
ALTER TABLE IF EXISTS push_notification_logs DROP CONSTRAINT IF EXISTS push_notification_logs_notification_id_fkey;
ALTER TABLE IF EXISTS push_notification_logs DROP CONSTRAINT IF EXISTS push_notification_logs_user_id_fkey;
ALTER TABLE IF EXISTS user_push_tokens DROP CONSTRAINT IF EXISTS user_push_tokens_user_id_fkey;

-- ============================================
-- STEP 2: Drop Tables (in dependency order)
-- ============================================

-- Drop collaboration-related tables (dependent tables first)
DROP TABLE IF EXISTS ai_assistant_sessions CASCADE;
DROP TABLE IF EXISTS avatar_presence CASCADE;
DROP TABLE IF EXISTS code_intelligence CASCADE;
DROP TABLE IF EXISTS collaboration_analytics CASCADE;
DROP TABLE IF EXISTS file_operations CASCADE;
DROP TABLE IF EXISTS file_sync_operations CASCADE;
DROP TABLE IF EXISTS live_cursors CASCADE;
DROP TABLE IF EXISTS session_messages CASCADE;
DROP TABLE IF EXISTS session_participants CASCADE;
DROP TABLE IF EXISTS voice_video_sessions CASCADE;
DROP TABLE IF EXISTS collaboration_sessions CASCADE;
DROP TABLE IF EXISTS code_review_sessions CASCADE;
DROP TABLE IF EXISTS github_webhook_events CASCADE;

-- Drop social media tables
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS follows CASCADE;

-- Drop developer marketplace tables (dependent tables first)
DROP TABLE IF EXISTS project_messages CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS developer_profiles CASCADE;
DROP TABLE IF EXISTS service_packages CASCADE;

-- Drop alternative invoice system tables (dependent tables first)
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS payment_records CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS invoice_templates CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

-- Drop duplicate/alternative tables
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS auth_events CASCADE;
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_activity_logs CASCADE;

-- Drop push notification tables
DROP TABLE IF EXISTS push_notification_logs CASCADE;
DROP TABLE IF EXISTS user_push_tokens CASCADE;

-- ============================================
-- STEP 3: Drop unused ENUM types (if they exist and are not used elsewhere)
-- ============================================

-- Note: We only drop enums if they're not used by remaining tables
-- Most enums are likely still used by other tables, so we'll be conservative

-- Check and drop only if safe (commented out for safety - uncomment if needed)
-- DROP TYPE IF EXISTS collaboration_status CASCADE;
-- DROP TYPE IF EXISTS session_status CASCADE;
-- DROP TYPE IF EXISTS project_status CASCADE;
-- DROP TYPE IF EXISTS quote_status CASCADE;
-- DROP TYPE IF EXISTS service_category CASCADE;

-- ============================================
-- Migration Complete
-- ============================================
-- Removed tables:
-- - Collaboration features (13 tables)
-- - Social media features (3 tables)
-- - Developer marketplace (6 tables)
-- - Alternative invoice system (5 tables)
-- - Duplicate/alternative implementations (5 tables)
-- - Push notifications (2 tables)
-- Total: 34 tables removed














