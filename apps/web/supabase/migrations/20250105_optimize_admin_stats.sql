-- Optimized Admin Statistics Migration
-- Creates efficient SQL functions for admin dashboard statistics

-- Function to get admin dashboard statistics in a single query
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS TABLE (
  total_users BIGINT,
  admin_users BIGINT,
  subscribed_users BIGINT,
  total_tickets BIGINT,
  open_tickets BIGINT,
  in_progress_tickets BIGINT,
  resolved_tickets BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      COUNT(*)::BIGINT as total,
      COUNT(*) FILTER (WHERE role = 'ADMIN')::BIGINT as admins,
      COUNT(*) FILTER (WHERE stripe_subscription_id IS NOT NULL)::BIGINT as subscribed
    FROM public.users
  ),
  ticket_stats AS (
    SELECT 
      COUNT(*)::BIGINT as total,
      COUNT(*) FILTER (WHERE status = 'open')::BIGINT as open,
      COUNT(*) FILTER (WHERE status = 'in_progress')::BIGINT as in_progress,
      COUNT(*) FILTER (WHERE status IN ('resolved', 'closed'))::BIGINT as resolved
    FROM public.support_tickets
  )
  SELECT 
    us.total as total_users,
    us.admins as admin_users,
    us.subscribed as subscribed_users,
    COALESCE(ts.total, 0)::BIGINT as total_tickets,
    COALESCE(ts.open, 0)::BIGINT as open_tickets,
    COALESCE(ts.in_progress, 0)::BIGINT as in_progress_tickets,
    COALESCE(ts.resolved, 0)::BIGINT as resolved_tickets
  FROM user_stats us
  CROSS JOIN ticket_stats ts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for support_tickets if they don't exist
CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON public.support_tickets(status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS users_role_idx ON public.users(role) WHERE role IS NOT NULL;
CREATE INDEX IF NOT EXISTS users_stripe_subscription_id_idx ON public.users(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- Add composite index for common admin queries
CREATE INDEX IF NOT EXISTS users_role_subscription_idx ON public.users(role, stripe_subscription_id) WHERE role IS NOT NULL;

-- Comment for documentation
COMMENT ON FUNCTION public.get_admin_stats IS 'Optimized function to get all admin dashboard statistics in a single query';



