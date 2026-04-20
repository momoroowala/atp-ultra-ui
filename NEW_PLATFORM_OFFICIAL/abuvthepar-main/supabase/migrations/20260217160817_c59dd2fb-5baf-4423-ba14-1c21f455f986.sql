
-- Drop store/shopify columns from user_profiles
ALTER TABLE public.user_profiles 
  DROP COLUMN IF EXISTS store_activated,
  DROP COLUMN IF EXISTS store_url,
  DROP COLUMN IF EXISTS shopify_access_token,
  DROP COLUMN IF EXISTS shopify_shop_domain,
  DROP COLUMN IF EXISTS shopify_shop_name;

-- Recreate get_users_with_progress without store references
CREATE OR REPLACE FUNCTION public.get_users_with_progress(
  p_page integer DEFAULT 1,
  p_per_page integer DEFAULT 15,
  p_search text DEFAULT ''::text,
  p_tier_ids uuid[] DEFAULT NULL::uuid[],
  p_role_id uuid DEFAULT NULL::uuid,
  p_store_filter text DEFAULT 'all'::text,
  p_course_ids uuid[] DEFAULT NULL::uuid[],
  p_sort_column text DEFAULT 'created_at'::text,
  p_sort_direction text DEFAULT 'desc'::text,
  p_invitation_filter text DEFAULT 'all'::text
)
RETURNS TABLE(
  id uuid, email text, first_name text, last_name text,
  tier text, tier_id uuid, role text, role_id uuid,
  is_active boolean, total_tasks integer, completed_tasks integer,
  progress_percentage integer, created_at timestamp with time zone,
  store_activated boolean, store_url text, shopify_shop_name text,
  last_sign_in_at timestamp with time zone, total_count bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_offset integer := GREATEST((p_page - 1) * p_per_page, 0); v_sort_dir text := LOWER(COALESCE(p_sort_direction, 'desc'));
BEGIN
  RETURN QUERY
  WITH total_active_tasks AS (SELECT COUNT(*)::int AS cnt FROM public.tasks tsk WHERE COALESCE(tsk.is_active, true) = true),
  task_stats AS (SELECT tr.user_id, COUNT(*) FILTER (WHERE tr.status = 'completed')::int AS completed_count FROM public.task_responses tr GROUP BY tr.user_id),
  base AS (
    SELECT up.id, COALESCE(up.user_email, '')::text AS email, up.first_name, up.last_name, up.tier_id, up.role_id, up.is_active, up.created_at,
      false AS store_activated, ''::text AS store_url, ''::text AS shopify_shop_name,
      COALESCE(ts.completed_count, 0) AS completed_tasks, tat.cnt AS total_tasks,
      COALESCE(ROUND((COALESCE(ts.completed_count, 0)::numeric / NULLIF(tat.cnt, 0)::numeric) * 100), 0)::int AS progress_percentage,
      COALESCE(ti.display_name, '')::text AS tier_name, COALESCE(ro.display_name, '')::text AS role_name,
      au.last_sign_in_at, COUNT(*) OVER() AS total_count
    FROM public.user_profiles up CROSS JOIN total_active_tasks tat
    LEFT JOIN task_stats ts ON ts.user_id = up.id
    LEFT JOIN public.tiers ti ON ti.id = up.tier_id
    LEFT JOIN public.roles ro ON ro.id = up.role_id
    LEFT JOIN auth.users au ON au.id = up.id
    WHERE (p_search = '' OR (COALESCE(up.user_email, '') ILIKE '%' || p_search || '%' OR COALESCE(up.first_name, '') ILIKE '%' || p_search || '%' OR COALESCE(up.last_name, '') ILIKE '%' || p_search || '%'))
      AND (p_tier_ids IS NULL OR up.tier_id = ANY(p_tier_ids))
      AND (p_role_id IS NULL OR up.role_id = p_role_id)
      AND (p_course_ids IS NULL OR EXISTS (SELECT 1 FROM public.user_course_access uca WHERE uca.user_id = up.id AND uca.course_id = ANY(p_course_ids)))
      AND (p_invitation_filter = 'all' OR (p_invitation_filter = 'confirmed' AND au.last_sign_in_at IS NOT NULL) OR (p_invitation_filter = 'pending' AND au.last_sign_in_at IS NULL))
  )
  SELECT base.id, base.email, base.first_name, base.last_name, base.tier_name, base.tier_id, base.role_name, base.role_id,
    base.is_active, base.total_tasks, base.completed_tasks, base.progress_percentage, base.created_at, base.store_activated, base.store_url, base.shopify_shop_name, base.last_sign_in_at, base.total_count
  FROM base
  ORDER BY
    CASE WHEN p_sort_column = 'name' AND v_sort_dir = 'asc' THEN base.first_name END ASC NULLS LAST,
    CASE WHEN p_sort_column = 'name' AND v_sort_dir = 'desc' THEN base.first_name END DESC NULLS LAST,
    CASE WHEN p_sort_column IN ('created_at', 'joinedDate') AND v_sort_dir = 'asc' THEN base.created_at END ASC NULLS LAST,
    CASE WHEN p_sort_column IN ('created_at', 'joinedDate') AND v_sort_dir = 'desc' THEN base.created_at END DESC NULLS LAST,
    CASE WHEN p_sort_column IN ('progress', 'progress_percentage') AND v_sort_dir = 'asc' THEN base.progress_percentage END ASC NULLS LAST,
    CASE WHEN p_sort_column IN ('progress', 'progress_percentage') AND v_sort_dir = 'desc' THEN base.progress_percentage END DESC NULLS LAST,
    CASE WHEN p_sort_column = 'tier' AND v_sort_dir = 'asc' THEN base.tier_name END ASC NULLS LAST,
    CASE WHEN p_sort_column = 'tier' AND v_sort_dir = 'desc' THEN base.tier_name END DESC NULLS LAST,
    CASE WHEN p_sort_column = 'invitation' AND v_sort_dir = 'asc' THEN (base.last_sign_in_at IS NOT NULL) END ASC,
    CASE WHEN p_sort_column = 'invitation' AND v_sort_dir = 'desc' THEN (base.last_sign_in_at IS NOT NULL) END DESC,
    base.created_at DESC NULLS LAST, base.id ASC
  LIMIT p_per_page OFFSET v_offset;
END;
$function$;
