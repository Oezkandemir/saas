-- Function to execute raw SQL statements (needed for creating tables and other operations)
-- This should be run in the Supabase SQL Editor
CREATE OR REPLACE FUNCTION public.execute_sql(sql TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 