-- Fix: shopify_activation_status table doesn't exist; those columns live on user_profiles

CREATE OR REPLACE FUNCTION public.get_users_with_progress(
  p_page integer DEFAULT 1,
  p_per_page integer DEFAULT 15,
  p_search text DEFAULT '',
  p_tier_ids uuid[] DEFAULT NULL,
  p_role_id uuid DEFAULT NULL,
  p_store_filter text DEFAULT 'all',
  p_course_ids uuid[] DEFAULT NULL,
  p_sort_column text DEFAULT 'first_name',
  p_sort_direction text DEFAULT 'asc'
)
RETURNS TABLE(
  id uuid,
  email text,
  first_name text,
  last_name text,
  tier text,
  tier_id uuid,
  role text,
  role_id uuid,
  is_active boolean,
  total_tasks integer,
  completed_tasks integer,
  progress_percentage integer,
  created_at timestamptz,
  store_activated boolean,
  store_url text,
  shopify_shop_name text,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset integer := GREATEST((p_page - 1) * p_per_page, 0);
  v_sort_dir text := LOWER(COALESCE(p_sort_direction, 'asc'));
BEGIN
  RETURN QUERY
  WITH total_active_tasks AS (
    SELECT COUNT(*)::int AS cnt
    FROM public.tasks t
    WHERE COALESCE(t.is_active, true) = true
  ),
  task_stats AS (
    SELECT tr.user_id,
           COUNT(*) FILTER (WHERE tr.status = 'completed')::int AS completed_count
    FROM public.task_responses tr
    GROUP BY tr.user_id
  ),
  base AS (
    SELECT
      up.id,
      COALESCE(up.user_email, '')::text AS email,
      up.first_name,
      up.last_name,
      up.tier_id,
      up.role_id,
      up.is_active,
      up.created_at,
      COALESCE(up.store_activated, false) AS store_activated,
      up.store_url,
      up.shopify_shop_name,
      COALESCE(ts.completed_count, 0) AS completed_tasks,
      tat.cnt AS total_tasks,
      COALESCE(ROUND((COALESCE(ts.completed_count, 0)::numeric / NULLIF(tat.cnt, 0)::numeric) * 100), 0)::int AS progress_percentage,
      COALESCE(t.display_name, t.tier_name, t.name, '')::text AS tier_name,
      COALESCE(r.display_name, r.role_key, '')::text AS role_name,
      COUNT(*) OVER() AS total_count
    FROM public.user_profiles up
    CROSS JOIN total_active_tasks tat
    LEFT JOIN task_stats ts ON ts.user_id = up.id
    LEFT JOIN public.tiers t ON t.id = up.tier_id
    LEFT JOIN public.roles r ON r.id = up.role_id
    WHERE
      (p_search = '' OR (
        COALESCE(up.user_email, '') ILIKE '%' || p_search || '%'
        OR COALESCE(up.first_name, '') ILIKE '%' || p_search || '%'
        OR COALESCE(up.last_name, '') ILIKE '%' || p_search || '%'
      ))
      AND (p_tier_ids IS NULL OR up.tier_id = ANY(p_tier_ids))
      AND (p_role_id IS NULL OR up.role_id = p_role_id)
      AND (
        p_store_filter = 'all'
        OR (p_store_filter = 'activated' AND COALESCE(up.store_activated, false) = true)
        OR (p_store_filter = 'not_activated' AND COALESCE(up.store_activated, false) = false)
      )
      AND (
        p_course_ids IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.user_course_access uca
          WHERE uca.user_id = up.id
            AND uca.course_id = ANY(p_course_ids)
            AND COALESCE(uca.is_active, true) = true
        )
      )
  )
  SELECT
    base.id,
    base.email,
    base.first_name,
    base.last_name,
    base.tier_name AS tier,
    base.tier_id,
    base.role_name AS role,
    base.role_id,
    base.is_active,
    base.total_tasks,
    base.completed_tasks,
    base.progress_percentage,
    base.created_at,
    base.store_activated,
    base.store_url,
    base.shopify_shop_name,
    base.total_count
  FROM base
  ORDER BY
    -- first_name
    CASE WHEN p_sort_column = 'first_name' AND v_sort_dir = 'asc' THEN base.first_name END ASC NULLS LAST,
    CASE WHEN p_sort_column = 'first_name' AND v_sort_dir = 'desc' THEN base.first_name END DESC NULLS LAST,

    -- last_name
    CASE WHEN p_sort_column = 'last_name' AND v_sort_dir = 'asc' THEN base.last_name END ASC NULLS LAST,
    CASE WHEN p_sort_column = 'last_name' AND v_sort_dir = 'desc' THEN base.last_name END DESC NULLS LAST,

    -- email
    CASE WHEN p_sort_column = 'email' AND v_sort_dir = 'asc' THEN base.email END ASC NULLS LAST,
    CASE WHEN p_sort_column = 'email' AND v_sort_dir = 'desc' THEN base.email END DESC NULLS LAST,

    -- progress_percentage
    CASE WHEN p_sort_column IN ('progress', 'progress_percentage') AND v_sort_dir = 'asc' THEN base.progress_percentage END ASC NULLS LAST,
    CASE WHEN p_sort_column IN ('progress', 'progress_percentage') AND v_sort_dir = 'desc' THEN base.progress_percentage END DESC NULLS LAST,

    -- created_at
    CASE WHEN p_sort_column = 'created_at' AND v_sort_dir = 'asc' THEN base.created_at END ASC NULLS LAST,
    CASE WHEN p_sort_column = 'created_at' AND v_sort_dir = 'desc' THEN base.created_at END DESC NULLS LAST,

    -- fallback for deterministic ordering
    base.first_name ASC NULLS LAST,
    base.id ASC
  LIMIT p_per_page
  OFFSET v_offset;
END;
$$;