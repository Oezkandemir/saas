-- Create function to get plan statistics for admin dashboard
-- This function calculates MRR, ARR, and total revenue by plan based on active Polar subscriptions

CREATE OR REPLACE FUNCTION public.get_plan_statistics()
RETURNS TABLE (
  plan_id UUID,
  plan_title TEXT,
  plan_key TEXT,
  user_count BIGINT,
  mrr DECIMAL(10,2),
  arr DECIMAL(10,2),
  total_revenue DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH user_subscriptions AS (
    -- Get active subscriptions from users table using Polar
    SELECT 
      u.id as user_id,
      u.polar_product_id,
      u.polar_subscription_id,
      p.id as matched_plan_id,
      p.title as matched_plan_title,
      p.plan_key as matched_plan_key,
      CASE 
        WHEN u.polar_product_id = p.polar_product_id_monthly THEN p.price_monthly
        WHEN u.polar_product_id = p.polar_product_id_yearly THEN p.price_yearly / 12.0
        ELSE NULL
      END as monthly_revenue,
      CASE 
        WHEN u.polar_product_id = p.polar_product_id_monthly THEN p.price_monthly * 12
        WHEN u.polar_product_id = p.polar_product_id_yearly THEN p.price_yearly
        ELSE NULL
      END as annual_revenue
    FROM public.users u
    LEFT JOIN public.plans p ON (
      u.polar_product_id = p.polar_product_id_monthly 
      OR u.polar_product_id = p.polar_product_id_yearly
    )
    WHERE u.polar_subscription_id IS NOT NULL
      AND (u.polar_current_period_end IS NULL OR u.polar_current_period_end > NOW())
  ),
  subscription_data AS (
    -- Get from subscriptions table using Polar
    SELECT 
      s.user_id,
      s.polar_product_id,
      s.polar_subscription_id,
      COALESCE(
        p_sub.id,
        (SELECT p_fallback.id FROM public.plans p_fallback WHERE p_fallback.plan_key = s.plan::text LIMIT 1)
      ) as matched_plan_id,
      COALESCE(
        p_sub.title,
        (SELECT p_fallback.title FROM public.plans p_fallback WHERE p_fallback.plan_key = s.plan::text LIMIT 1)
      ) as matched_plan_title,
      COALESCE(
        p_sub.plan_key,
        s.plan::text
      ) as matched_plan_key,
      COALESCE(
        CASE 
          WHEN s.polar_product_id = p_sub.polar_product_id_monthly THEN p_sub.price_monthly
          WHEN s.polar_product_id = p_sub.polar_product_id_yearly THEN p_sub.price_yearly / 12.0
          ELSE NULL
        END,
        CASE 
          WHEN s.plan::text = p_sub.plan_key THEN
            CASE 
              WHEN p_sub.price_monthly > 0 THEN p_sub.price_monthly
              ELSE p_sub.price_yearly / 12.0
            END
          ELSE NULL
        END,
        s.monthly_revenue,
        0
      ) as monthly_revenue,
      COALESCE(
        CASE 
          WHEN s.polar_product_id = p_sub.polar_product_id_monthly THEN p_sub.price_monthly * 12
          WHEN s.polar_product_id = p_sub.polar_product_id_yearly THEN p_sub.price_yearly
          ELSE NULL
        END,
        CASE 
          WHEN s.plan::text = p_sub.plan_key THEN
            CASE 
              WHEN p_sub.price_monthly > 0 THEN p_sub.price_monthly * 12
              ELSE p_sub.price_yearly
            END
          ELSE NULL
        END,
        COALESCE(s.monthly_revenue, 0) * 12,
        0
      ) as annual_revenue
    FROM public.subscriptions s
    LEFT JOIN public.plans p_sub ON (
      s.polar_product_id = p_sub.polar_product_id_monthly 
      OR s.polar_product_id = p_sub.polar_product_id_yearly
      OR s.plan::text = p_sub.plan_key
    )
    WHERE s.status = 'active'
      AND (s.current_period_end IS NULL OR s.current_period_end > NOW())
      AND s.polar_subscription_id IS NOT NULL
      -- Exclude users already in user_subscriptions
      AND NOT EXISTS (
        SELECT 1 FROM user_subscriptions us WHERE us.user_id = s.user_id
      )
  ),
  all_subscriptions AS (
    SELECT * FROM user_subscriptions
    UNION ALL
    SELECT * FROM subscription_data
  ),
  -- Match unmatched subscriptions to plans (default to free if no match)
  final_mapping AS (
    SELECT 
      user_id,
      COALESCE(
        matched_plan_id,
        (SELECT p_free.id FROM public.plans p_free WHERE p_free.plan_key = 'free' LIMIT 1)
      ) as final_plan_id,
      COALESCE(
        matched_plan_title,
        (SELECT p_free.title FROM public.plans p_free WHERE p_free.plan_key = 'free' LIMIT 1)
      ) as final_plan_title,
      COALESCE(
        matched_plan_key,
        'free'
      ) as final_plan_key,
      COALESCE(monthly_revenue, 0) as monthly_revenue,
      COALESCE(annual_revenue, 0) as annual_revenue
    FROM all_subscriptions
  )
  SELECT 
    p.id as plan_id,
    p.title as plan_title,
    p.plan_key,
    COUNT(DISTINCT fm.user_id)::BIGINT as user_count,
    COALESCE(SUM(fm.monthly_revenue), 0)::DECIMAL(10,2) as mrr,
    COALESCE(SUM(fm.annual_revenue), 0)::DECIMAL(10,2) as arr,
    COALESCE(SUM(fm.annual_revenue), 0)::DECIMAL(10,2) as total_revenue
  FROM public.plans p
  LEFT JOIN final_mapping fm ON fm.final_plan_id = p.id
  WHERE p.is_active = true
  GROUP BY p.id, p.title, p.plan_key
  ORDER BY mrr DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_plan_statistics IS 'Get plan statistics including MRR, ARR, and total revenue grouped by plan using Polar subscriptions';

