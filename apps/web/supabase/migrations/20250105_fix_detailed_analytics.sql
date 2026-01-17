-- Fix get_detailed_analytics function
-- Replaces old function that used deleted user_sessions table
-- Uses page_views and user_interactions instead

DROP FUNCTION IF EXISTS public.get_detailed_analytics(INTEGER);

CREATE OR REPLACE FUNCTION public.get_detailed_analytics(
  p_days_range INTEGER DEFAULT 30
)
RETURNS TABLE (
  page_view_stats JSONB,
  user_engagement JSONB,
  device_stats JSONB,
  browser_stats JSONB,
  referrer_stats JSONB
) AS $$
DECLARE
  start_date TIMESTAMPTZ;
BEGIN
  start_date := NOW() - (p_days_range || ' days')::INTERVAL;

  RETURN QUERY
  SELECT 
    -- Page view stats by day
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'day', TO_CHAR(day, 'YYYY-MM-DD'),
          'view_count', view_count
        )
        ORDER BY day
      )
      FROM (
        SELECT 
          DATE(created_at) as day,
          COUNT(*)::BIGINT as view_count
        FROM public.page_views
        WHERE created_at >= start_date
        GROUP BY DATE(created_at)
        ORDER BY day
      ) daily_stats
    ), '[]'::jsonb) as page_view_stats,

    -- User engagement by interaction type
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'interaction_type', interaction_type,
          'count', count
        )
        ORDER BY count DESC
      )
      FROM (
        SELECT 
          interaction_type,
          COUNT(*)::BIGINT as count
        FROM public.user_interactions
        WHERE created_at >= start_date
        GROUP BY interaction_type
        ORDER BY count DESC
      ) engagement_stats
    ), '[]'::jsonb) as user_engagement,

    -- Device statistics
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'device_type', device_type,
          'count', count
        )
        ORDER BY count DESC
      )
      FROM (
        SELECT 
          COALESCE(device_type, 'Unknown') as device_type,
          COUNT(*)::BIGINT as count
        FROM public.page_views
        WHERE created_at >= start_date
        GROUP BY device_type
        ORDER BY count DESC
        LIMIT 10
      ) device_stats
    ), '[]'::jsonb) as device_stats,

    -- Browser statistics
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'browser', browser,
          'count', count
        )
        ORDER BY count DESC
      )
      FROM (
        SELECT 
          COALESCE(browser, 'Unknown') as browser,
          COUNT(*)::BIGINT as count
        FROM public.page_views
        WHERE created_at >= start_date
        GROUP BY browser
        ORDER BY count DESC
        LIMIT 10
      ) browser_stats
    ), '[]'::jsonb) as browser_stats,

    -- Referrer statistics
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'referrer', referrer,
          'count', count
        )
        ORDER BY count DESC
      )
      FROM (
        SELECT 
          COALESCE(referrer, 'Direct') as referrer,
          COUNT(*)::BIGINT as count
        FROM public.page_views
        WHERE created_at >= start_date
          AND referrer IS NOT NULL
        GROUP BY referrer
        ORDER BY count DESC
        LIMIT 10
      ) referrer_stats
    ), '[]'::jsonb) as referrer_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment for documentation
COMMENT ON FUNCTION public.get_detailed_analytics IS 'Get detailed analytics data using page_views and user_interactions tables (fixed version without user_sessions)';

