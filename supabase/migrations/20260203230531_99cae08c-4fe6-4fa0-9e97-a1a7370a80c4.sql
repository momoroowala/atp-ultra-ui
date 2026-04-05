-- Create optimized function to get users with progress using CTEs and JOINs
CREATE OR REPLACE FUNCTION public.get_users_with_progress(
  p_page INT DEFAULT 1,
  p_per_page INT DEFAULT 15,
  p_search TEXT DEFAULT '',
  p_tier_ids UUID[] DEFAULT NULL,
  p_role_id UUID DEFAULT NULL,
  p_store_filter TEXT DEFAULT 'all',
  p_course_ids UUID[] DEFAULT NULL,
  p_sort_column TEXT DEFAULT 'first_name',
  p_sort_direction TEXT DEFAULT 'asc'
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  tier TEXT,
  tier_id UUID,
  role TEXT,
  role_id UUID,
  is_active BOOLEAN,
  total_tasks INT,
  completed_tasks INT,
  progress_percentage INT,
  created_at TIMESTAMPTZ,
  store_activated BOOLEAN,
  store_url TEXT,
  shopify_shop_name TEXT,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH task_stats AS (
    SELECT 
      tr.user_id,
      COUNT(*) FILTER (WHERE tr.status = 'completed')::INT as completed_count
    FROM task_responses tr
    GROUP BY tr.user_id
  ),
  total_active_tasks AS (
    SELECT COUNT(*)::INT as cnt FROM tasks WHERE is_active = true
  ),
  course_access_users AS (
    SELECT DISTINCT uca.user_id
    FROM user_course_access uca
    WHERE p_course_ids IS NULL OR uca.course_id = ANY(p_course_ids)
  )
  SELECT 
    up.id,
    up.user_email as email,
    up.first_name,
    up.last_name,
    COALESCE(t.display_name, 'No Tier')::TEXT as tier,
    up.tier_id,
    COALESCE(r.display_name, 'No Role')::TEXT as role,
    up.role_id,
    up.is_active,
    tt.cnt as total_tasks,
    COALESCE(ts.completed_count, 0) as completed_tasks,
    CASE 
      WHEN tt.cnt > 0 THEN ROUND((COALESCE(ts.completed_count, 0)::numeric / tt.cnt::numeric) * 100)::INT
      ELSE 0
    END as progress_percentage,
    up.created_at,
    COALESCE(up.store_activated, false) as store_activated,
    up.store_url,
    up.shopify_shop_name,
    COUNT(*) OVER()::BIGINT as total_count
  FROM user_profiles up
  CROSS JOIN total_active_tasks tt
  LEFT JOIN task_stats ts ON ts.user_id = up.id
  LEFT JOIN tiers t ON t.id = up.tier_id
  LEFT JOIN roles r ON r.id = up.role_id
  WHERE 
    -- Search filter
    (p_search = '' OR p_search IS NULL OR 
     up.first_name ILIKE '%' || p_search || '%' OR 
     up.last_name ILIKE '%' || p_search || '%' OR 
     up.user_email ILIKE '%' || p_search || '%')
    -- Tier filter
    AND (p_tier_ids IS NULL OR up.tier_id = ANY(p_tier_ids))
    -- Role filter
    AND (p_role_id IS NULL OR up.role_id = p_role_id)
    -- Store activation filter
    AND (
      p_store_filter = 'all' OR p_store_filter IS NULL
      OR (p_store_filter = 'activated' AND up.store_activated = true)
      OR (p_store_filter = 'not_activated' AND (up.store_activated IS NULL OR up.store_activated = false))
    )
    -- Course access filter
    AND (p_course_ids IS NULL OR up.id IN (SELECT user_id FROM course_access_users))
  ORDER BY
    CASE WHEN p_sort_column = 'progress' AND p_sort_direction = 'asc' 
         THEN CASE WHEN tt.cnt > 0 THEN ROUND((COALESCE(ts.completed_count, 0)::numeric / tt.cnt::numeric) * 100) ELSE 0 END END ASC NULLS LAST,
    CASE WHEN p_sort_column = 'progress' AND p_sort_direction = 'desc' 
         THEN CASE WHEN tt.cnt > 0 THEN ROUND((COALESCE(ts.completed_count, 0)::numeric / tt.cnt::numeric) * 100) ELSE 0 END END DESC NULLS LAST,
    CASE WHEN p_sort_column = 'first_name' AND p_sort_direction = 'asc' THEN up.first_name END ASC NULLS LAST,
    CASE WHEN p_sort_column = 'first_name' AND p_sort_direction = 'desc' THEN up.first_name END DESC NULLS LAST,
    CASE WHEN p_sort_column = 'last_name' AND p_sort_direction = 'asc' THEN up.last_name END ASC NULLS LAST,
    CASE WHEN p_sort_column = 'last_name' AND p_sort_direction = 'desc' THEN up.last_name END DESC NULLS LAST,
    CASE WHEN p_sort_column = 'email' AND p_sort_direction = 'asc' THEN up.user_email END ASC NULLS LAST,
    CASE WHEN p_sort_column = 'email' AND p_sort_direction = 'desc' THEN up.user_email END DESC NULLS LAST,
    CASE WHEN p_sort_column = 'joinedDate' AND p_sort_direction = 'asc' THEN up.created_at END ASC NULLS LAST,
    CASE WHEN p_sort_column = 'joinedDate' AND p_sort_direction = 'desc' THEN up.created_at END DESC NULLS LAST,
    CASE WHEN p_sort_column = 'tier' AND p_sort_direction = 'asc' THEN t.display_name END ASC NULLS LAST,
    CASE WHEN p_sort_column = 'tier' AND p_sort_direction = 'desc' THEN t.display_name END DESC NULLS LAST,
    CASE WHEN p_sort_column = 'role' AND p_sort_direction = 'asc' THEN r.display_name END ASC NULLS LAST,
    CASE WHEN p_sort_column = 'role' AND p_sort_direction = 'desc' THEN r.display_name END DESC NULLS LAST,
    up.first_name ASC NULLS LAST
  LIMIT p_per_page
  OFFSET (p_page - 1) * p_per_page;
END;
$$;