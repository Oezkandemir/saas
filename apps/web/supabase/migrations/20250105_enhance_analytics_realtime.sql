-- Enhanced Analytics with Geolocation and Real-time Tracking
-- Extends page_views and user_interactions with location and detailed device info

-- Add geolocation and enhanced device fields to page_views table
ALTER TABLE public.page_views
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS ip_address INET,
  ADD COLUMN IF NOT EXISTS browser_version TEXT,
  ADD COLUMN IF NOT EXISTS os_version TEXT,
  ADD COLUMN IF NOT EXISTS screen_width INTEGER,
  ADD COLUMN IF NOT EXISTS screen_height INTEGER,
  ADD COLUMN IF NOT EXISTS viewport_width INTEGER,
  ADD COLUMN IF NOT EXISTS viewport_height INTEGER,
  ADD COLUMN IF NOT EXISTS pixel_ratio DECIMAL(3, 2),
  ADD COLUMN IF NOT EXISTS language TEXT,
  ADD COLUMN IF NOT EXISTS is_mobile BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_tablet BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_desktop BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS connection_type TEXT,
  ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT true;

-- Add geolocation fields to user_interactions table
ALTER TABLE public.user_interactions
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS ip_address INET,
  ADD COLUMN IF NOT EXISTS coordinates POINT;

-- Create indexes for geolocation queries
CREATE INDEX IF NOT EXISTS page_views_country_idx ON public.page_views(country) WHERE country IS NOT NULL;
CREATE INDEX IF NOT EXISTS page_views_city_idx ON public.page_views(city) WHERE city IS NOT NULL;
CREATE INDEX IF NOT EXISTS page_views_created_at_idx ON public.page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS page_views_user_id_idx ON public.page_views(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS page_views_session_id_idx ON public.page_views(session_id);
CREATE INDEX IF NOT EXISTS user_interactions_country_idx ON public.user_interactions(country) WHERE country IS NOT NULL;
CREATE INDEX IF NOT EXISTS user_interactions_created_at_idx ON public.user_interactions(created_at DESC);

-- Create function to get real-time active users (last 5 minutes)
CREATE OR REPLACE FUNCTION public.get_realtime_active_users()
RETURNS TABLE (
  user_id UUID,
  session_id TEXT,
  page_path TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  last_activity TIMESTAMPTZ,
  duration_seconds INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (pv.session_id)
    pv.user_id,
    pv.session_id,
    pv.page_path,
    pv.country,
    pv.city,
    pv.device_type,
    pv.browser,
    pv.os,
    MAX(pv.created_at) OVER (PARTITION BY pv.session_id) as last_activity,
    EXTRACT(EPOCH FROM (NOW() - MIN(pv.created_at) OVER (PARTITION BY pv.session_id)))::INTEGER as duration_seconds
  FROM public.page_views pv
  WHERE pv.created_at >= NOW() - INTERVAL '5 minutes'
  ORDER BY pv.session_id, pv.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get real-time page views (last hour)
CREATE OR REPLACE FUNCTION public.get_realtime_page_views()
RETURNS TABLE (
  page_path TEXT,
  view_count BIGINT,
  unique_visitors BIGINT,
  avg_duration DECIMAL(10, 2),
  countries TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pv.page_path,
    COUNT(*)::BIGINT as view_count,
    COUNT(DISTINCT pv.session_id)::BIGINT as unique_visitors,
    AVG(pv.duration_seconds)::DECIMAL(10, 2) as avg_duration,
    ARRAY_AGG(DISTINCT pv.country) FILTER (WHERE pv.country IS NOT NULL) as countries
  FROM public.page_views pv
  WHERE pv.created_at >= NOW() - INTERVAL '1 hour'
  GROUP BY pv.page_path
  ORDER BY view_count DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user activity timeline
CREATE OR REPLACE FUNCTION public.get_user_activity_timeline(
  p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  hour TIMESTAMPTZ,
  page_views BIGINT,
  interactions BIGINT,
  unique_users BIGINT,
  countries TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  WITH hourly_stats AS (
    SELECT 
      DATE_TRUNC('hour', created_at) as hour,
      COUNT(*) FILTER (WHERE table_name = 'page_views')::BIGINT as page_views,
      COUNT(*) FILTER (WHERE table_name = 'interactions')::BIGINT as interactions,
      COUNT(DISTINCT user_id) FILTER (WHERE table_name = 'page_views')::BIGINT as unique_users,
      ARRAY_AGG(DISTINCT country) FILTER (WHERE country IS NOT NULL) as countries
    FROM (
      SELECT created_at, user_id, country, 'page_views' as table_name
      FROM public.page_views
      WHERE created_at >= NOW() - (p_hours || ' hours')::INTERVAL
      UNION ALL
      SELECT created_at, user_id, country, 'interactions' as table_name
      FROM public.user_interactions
      WHERE created_at >= NOW() - (p_hours || ' hours')::INTERVAL
    ) combined
    GROUP BY DATE_TRUNC('hour', created_at)
  )
  SELECT 
    hour,
    COALESCE(SUM(page_views) OVER (ORDER BY hour), 0)::BIGINT as page_views,
    COALESCE(SUM(interactions) OVER (ORDER BY hour), 0)::BIGINT as interactions,
    MAX(unique_users) OVER (ORDER BY hour)::BIGINT as unique_users,
    countries
  FROM hourly_stats
  ORDER BY hour DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get geolocation statistics
CREATE OR REPLACE FUNCTION public.get_geolocation_stats(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  country TEXT,
  city TEXT,
  region TEXT,
  user_count BIGINT,
  page_views BIGINT,
  avg_session_duration DECIMAL(10, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pv.country,
    pv.city,
    pv.region,
    COUNT(DISTINCT pv.user_id)::BIGINT as user_count,
    COUNT(*)::BIGINT as page_views,
    AVG(pv.duration_seconds)::DECIMAL(10, 2) as avg_session_duration
  FROM public.page_views pv
  WHERE pv.created_at >= NOW() - (p_days || ' days')::INTERVAL
    AND pv.country IS NOT NULL
  GROUP BY pv.country, pv.city, pv.region
  ORDER BY page_views DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get device statistics
CREATE OR REPLACE FUNCTION public.get_device_statistics(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  device_type TEXT,
  browser TEXT,
  browser_version TEXT,
  os TEXT,
  os_version TEXT,
  screen_resolution TEXT,
  user_count BIGINT,
  page_views BIGINT,
  avg_duration DECIMAL(10, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pv.device_type,
    pv.browser,
    pv.browser_version,
    pv.os,
    pv.os_version,
    CONCAT(pv.screen_width, 'x', pv.screen_height) as screen_resolution,
    COUNT(DISTINCT pv.user_id)::BIGINT as user_count,
    COUNT(*)::BIGINT as page_views,
    AVG(pv.duration_seconds)::DECIMAL(10, 2) as avg_duration
  FROM public.page_views pv
  WHERE pv.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY 
    pv.device_type, 
    pv.browser, 
    pv.browser_version, 
    pv.os, 
    pv.os_version,
    CONCAT(pv.screen_width, 'x', pv.screen_height)
  ORDER BY page_views DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for page_views and user_interactions
-- Note: Tables are already added to realtime in previous migrations, but we ensure they're there
DO $$
BEGIN
  -- Try to add tables to realtime publication (will fail silently if already added)
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.page_views;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_interactions;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- Comments for documentation
COMMENT ON FUNCTION public.get_realtime_active_users IS 'Get currently active users (last 5 minutes)';
COMMENT ON FUNCTION public.get_realtime_page_views IS 'Get real-time page view statistics (last hour)';
COMMENT ON FUNCTION public.get_user_activity_timeline IS 'Get user activity timeline by hour';
COMMENT ON FUNCTION public.get_geolocation_stats IS 'Get geolocation statistics for analytics';
COMMENT ON FUNCTION public.get_device_statistics IS 'Get detailed device statistics for analytics';

