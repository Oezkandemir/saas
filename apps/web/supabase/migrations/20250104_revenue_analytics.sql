-- Revenue Analytics Enhancement Migration
-- Enhanced revenue tracking and analytics for admin dashboard

-- Check if subscriptions table exists, if not create it
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

-- Add revenue tracking columns if they don't exist
DO $$ 
BEGIN
  -- Add monthly_revenue if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'monthly_revenue'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN monthly_revenue DECIMAL(10,2) DEFAULT 0.00;
  END IF;

  -- Add total_revenue if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'total_revenue'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN total_revenue DECIMAL(10,2) DEFAULT 0.00;
  END IF;

  -- Add currency if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'currency'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN currency TEXT DEFAULT 'EUR';
  END IF;
END $$;

-- Create revenue_summary view for aggregated revenue data
CREATE OR REPLACE VIEW public.revenue_summary AS
SELECT 
  DATE_TRUNC('month', s.created_at) as month,
  s.plan,
  s.status,
  COUNT(DISTINCT s.user_id) as subscriber_count,
  SUM(s.monthly_revenue) as total_monthly_revenue,
  AVG(s.monthly_revenue) as avg_monthly_revenue,
  s.currency
FROM public.subscriptions s
WHERE s.status = 'active'
GROUP BY DATE_TRUNC('month', s.created_at), s.plan, s.status, s.currency
ORDER BY month DESC, s.plan;

-- Create function to get revenue by period
CREATE OR REPLACE FUNCTION public.get_revenue_by_period(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '12 months',
  p_end_date TIMESTAMPTZ DEFAULT NOW(),
  p_group_by TEXT DEFAULT 'month' -- 'day', 'week', 'month', 'year'
)
RETURNS TABLE (
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  total_revenue DECIMAL(10,2),
  subscriber_count BIGINT,
  avg_revenue_per_subscriber DECIMAL(10,2)
) AS $$
DECLARE
  date_trunc_format TEXT;
BEGIN
  -- Determine date trunc format based on group_by parameter
  CASE p_group_by
    WHEN 'day' THEN date_trunc_format := 'day';
    WHEN 'week' THEN date_trunc_format := 'week';
    WHEN 'month' THEN date_trunc_format := 'month';
    WHEN 'year' THEN date_trunc_format := 'year';
    ELSE date_trunc_format := 'month';
  END CASE;

  RETURN QUERY
  SELECT 
    DATE_TRUNC(date_trunc_format, s.created_at) as period_start,
    DATE_TRUNC(date_trunc_format, s.created_at) + 
      CASE date_trunc_format
        WHEN 'day' THEN INTERVAL '1 day'
        WHEN 'week' THEN INTERVAL '1 week'
        WHEN 'month' THEN INTERVAL '1 month'
        WHEN 'year' THEN INTERVAL '1 year'
      END as period_end,
    SUM(COALESCE(s.monthly_revenue, 0)) as total_revenue,
    COUNT(DISTINCT s.user_id)::BIGINT as subscriber_count,
    CASE 
      WHEN COUNT(DISTINCT s.user_id) > 0 
      THEN SUM(COALESCE(s.monthly_revenue, 0)) / COUNT(DISTINCT s.user_id)
      ELSE 0
    END as avg_revenue_per_subscriber
  FROM public.subscriptions s
  WHERE s.created_at >= p_start_date
    AND s.created_at <= p_end_date
    AND s.status = 'active'
  GROUP BY DATE_TRUNC(date_trunc_format, s.created_at)
  ORDER BY period_start DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get revenue by plan
CREATE OR REPLACE FUNCTION public.get_revenue_by_plan(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '12 months',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  plan subscription_plan,
  subscriber_count BIGINT,
  total_revenue DECIMAL(10,2),
  avg_revenue_per_subscriber DECIMAL(10,2),
  mrr DECIMAL(10,2) -- Monthly Recurring Revenue
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.plan,
    COUNT(DISTINCT s.user_id)::BIGINT as subscriber_count,
    SUM(COALESCE(s.monthly_revenue, 0)) as total_revenue,
    CASE 
      WHEN COUNT(DISTINCT s.user_id) > 0 
      THEN SUM(COALESCE(s.monthly_revenue, 0)) / COUNT(DISTINCT s.user_id)
      ELSE 0
    END as avg_revenue_per_subscriber,
    SUM(COALESCE(s.monthly_revenue, 0)) as mrr
  FROM public.subscriptions s
  WHERE s.created_at >= p_start_date
    AND s.created_at <= p_end_date
    AND s.status = 'active'
  GROUP BY s.plan
  ORDER BY mrr DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get subscription metrics
CREATE OR REPLACE FUNCTION public.get_subscription_metrics()
RETURNS TABLE (
  total_subscribers BIGINT,
  active_subscribers BIGINT,
  cancelled_subscribers BIGINT,
  total_mrr DECIMAL(10,2),
  churn_rate DECIMAL(5,2),
  avg_revenue_per_user DECIMAL(10,2)
) AS $$
DECLARE
  total_count BIGINT;
  active_count BIGINT;
  cancelled_count BIGINT;
  total_mrr_value DECIMAL(10,2);
BEGIN
  -- Get total subscribers
  SELECT COUNT(DISTINCT user_id) INTO total_count
  FROM public.subscriptions;

  -- Get active subscribers
  SELECT COUNT(DISTINCT user_id) INTO active_count
  FROM public.subscriptions
  WHERE status = 'active';

  -- Get cancelled subscribers
  SELECT COUNT(DISTINCT user_id) INTO cancelled_count
  FROM public.subscriptions
  WHERE status = 'canceled';

  -- Get total MRR
  SELECT COALESCE(SUM(monthly_revenue), 0) INTO total_mrr_value
  FROM public.subscriptions
  WHERE status = 'active';

  RETURN QUERY
  SELECT 
    total_count as total_subscribers,
    active_count as active_subscribers,
    cancelled_count as cancelled_subscribers,
    total_mrr_value as total_mrr,
    CASE 
      WHEN total_count > 0 
      THEN (cancelled_count::DECIMAL / total_count::DECIMAL) * 100
      ELSE 0
    END as churn_rate,
    CASE 
      WHEN active_count > 0 
      THEN total_mrr_value / active_count
      ELSE 0
    END as avg_revenue_per_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS subscriptions_plan_idx ON public.subscriptions(plan);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS subscriptions_created_at_idx ON public.subscriptions(created_at DESC);

-- Comments for documentation
COMMENT ON VIEW public.revenue_summary IS 'Aggregated revenue data by month, plan, and status';
COMMENT ON FUNCTION public.get_revenue_by_period IS 'Get revenue statistics grouped by time period';
COMMENT ON FUNCTION public.get_revenue_by_plan IS 'Get revenue statistics grouped by subscription plan';
COMMENT ON FUNCTION public.get_subscription_metrics IS 'Get overall subscription metrics and KPIs';











