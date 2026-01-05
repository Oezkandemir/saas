-- Optimized Analytics Functions Migration
-- Creates efficient SQL functions for analytics queries

-- Function to get aggregated user statistics
CREATE OR REPLACE FUNCTION public.get_user_stats_aggregated()
RETURNS TABLE (
  total_users BIGINT,
  admin_count BIGINT,
  banned_count BIGINT,
  subscribers_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_users,
    COUNT(*) FILTER (WHERE role = 'ADMIN')::BIGINT as admin_count,
    COUNT(*) FILTER (WHERE status = 'banned')::BIGINT as banned_count,
    COUNT(*) FILTER (WHERE stripe_subscription_id IS NOT NULL)::BIGINT as subscribers_count
  FROM public.users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user growth by month
CREATE OR REPLACE FUNCTION public.get_user_growth_by_month()
RETURNS TABLE (
  month TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
    COUNT(*)::BIGINT as count
  FROM public.users
  GROUP BY DATE_TRUNC('month', created_at)
  ORDER BY month DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get aggregated ticket statistics
CREATE OR REPLACE FUNCTION public.get_ticket_stats_aggregated()
RETURNS TABLE (
  open BIGINT,
  in_progress BIGINT,
  resolved BIGINT,
  closed BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE status = 'open')::BIGINT as open,
    COUNT(*) FILTER (WHERE status = 'in_progress')::BIGINT as in_progress,
    COUNT(*) FILTER (WHERE status = 'resolved')::BIGINT as resolved,
    COUNT(*) FILTER (WHERE status = 'closed')::BIGINT as closed
  FROM public.support_tickets;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON FUNCTION public.get_user_stats_aggregated IS 'Optimized function to get aggregated user statistics';
COMMENT ON FUNCTION public.get_user_growth_by_month IS 'Get user growth statistics grouped by month';
COMMENT ON FUNCTION public.get_ticket_stats_aggregated IS 'Get aggregated ticket statistics by status';




















