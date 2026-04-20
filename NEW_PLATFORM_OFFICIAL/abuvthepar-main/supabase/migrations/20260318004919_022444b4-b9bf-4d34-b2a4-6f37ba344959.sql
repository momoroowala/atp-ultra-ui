
CREATE OR REPLACE FUNCTION public.get_users_with_progress(p_page integer DEFAULT 1, p_per_page integer DEFAULT 15, p_search text DEFAULT ''::text, p_tier_ids uuid[] DEFAULT NULL::uuid[], p_role_id uuid DEFAULT NULL::uuid, p_course_ids uuid[] DEFAULT NULL::uuid[], p_sort_column text DEFAULT 'created_at'::text, p_sort_direction text DEFAULT 'desc'::text, p_invitation_filter text DEFAULT 'all'::text, p_csm_filter text DEFAULT NULL::text, p_onboarding_filter text DEFAULT 'all'::text, p_guarantee_filter text DEFAULT 'all'::text)
 RETURNS TABLE(id uuid, email text, first_name text, last_name text, tier text, tier_id uuid, role text, role_id uuid, is_active boolean, total_tasks integer, completed_tasks integer, progress_percentage integer, created_at timestamp with time zone, last_sign_in_at timestamp with time zone, total_count bigint, assigned_csm_id uuid, onboarding_completed boolean, onboarding_date timestamp with time zone, offboarding_date date, guarantee_status text, onboarding_booking_status text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_offset integer := GREATEST((p_page - 1) * p_per_page, 0);
  v_sort_dir text := LOWER(COALESCE(p_sort_direction, 'desc'));
  v_csm_uuid uuid := NULL;
BEGIN
  IF p_csm_filter IS NOT NULL AND p_csm_filter != 'unassigned' THEN
    BEGIN
      v_csm_uuid := p_csm_filter::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_csm_uuid := NULL;
    END;
  END IF;

  RETURN QUERY
  WITH total_active_tasks AS (
    SELECT COUNT(*)::int AS cnt FROM public.tasks tsk WHERE COALESCE(tsk.is_active, true) = true
  ),
  task_stats AS (
    SELECT tr.user_id, COUNT(*) FILTER (WHERE tr.status = 'completed')::int AS completed_count
    FROM public.task_responses tr GROUP BY tr.user_id
  ),
  base AS (
    SELECT up.id, COALESCE(up.user_email, '')::text AS email, up.first_name, up.last_name,
      up.tier_id, up.role_id, up.is_active, up.created_at,
      up.assigned_csm_id,
      COALESCE(up.onboarding_completed, false) AS onboarding_completed,
      up.onboarding_date,
      up.offboarding_date,
      COALESCE(up.guarantee_status, 'pending')::text AS guarantee_status,
      up.onboarding_booking_status::text AS onboarding_booking_status,
      COALESCE(ts.completed_count, 0) AS completed_tasks, tat.cnt AS total_tasks,
      COALESCE(ROUND((COALESCE(ts.completed_count, 0)::numeric / NULLIF(tat.cnt, 0)::numeric) * 100), 0)::int AS progress_percentage,
      COALESCE(ti.display_name, '')::text AS tier_name,
      COALESCE(ro.display_name, '')::text AS role_name,
      au.last_sign_in_at,
      COUNT(*) OVER() AS total_count
    FROM public.user_profiles up
    CROSS JOIN total_active_tasks tat
    LEFT JOIN task_stats ts ON ts.user_id = up.id
    LEFT JOIN public.tiers ti ON ti.id = up.tier_id
    LEFT JOIN public.roles ro ON ro.id = up.role_id
    LEFT JOIN auth.users au ON au.id = up.id
    WHERE (p_search = '' OR (
      COALESCE(up.user_email, '') ILIKE '%' || p_search || '%'
      OR COALESCE(up.first_name, '') ILIKE '%' || p_search || '%'
      OR COALESCE(up.last_name, '') ILIKE '%' || p_search || '%'
    ))
    AND (p_tier_ids IS NULL OR up.tier_id = ANY(p_tier_ids))
    AND (p_role_id IS NULL OR up.role_id = p_role_id)
    AND (p_course_ids IS NULL OR EXISTS (
      SELECT 1 FROM public.user_course_access uca WHERE uca.user_id = up.id AND uca.course_id = ANY(p_course_ids)
    ))
    AND (p_invitation_filter = 'all'
      OR (p_invitation_filter = 'confirmed' AND au.last_sign_in_at IS NOT NULL)
      OR (p_invitation_filter = 'pending' AND au.last_sign_in_at IS NULL)
      OR (p_invitation_filter = 'logged_in' AND au.last_sign_in_at IS NOT NULL AND up.is_active = true AND au.last_sign_in_at > now() - interval '14 days')
      OR (p_invitation_filter = 'never_logged_in' AND au.last_sign_in_at IS NULL)
      OR (p_invitation_filter = 'at_risk' AND au.last_sign_in_at IS NOT NULL AND up.is_active = true AND au.last_sign_in_at <= now() - interval '14 days')
      OR (p_invitation_filter = 'refunded' AND up.is_active = false)
    )
    AND (p_csm_filter IS NULL
      OR (p_csm_filter = 'unassigned' AND up.assigned_csm_id IS NULL)
      OR (v_csm_uuid IS NOT NULL AND up.assigned_csm_id = v_csm_uuid)
    )
    AND (p_onboarding_filter = 'all'
      OR (p_onboarding_filter = 'completed' AND up.onboarding_booking_status = 'completed')
      OR (p_onboarding_filter = 'missed' AND up.onboarding_booking_status = 'missed')
      OR (p_onboarding_filter = 'rescheduled' AND up.onboarding_booking_status = 'rescheduled')
      OR (p_onboarding_filter = 'not_started' AND up.onboarding_booking_status IS NULL)
    )
    AND (p_guarantee_filter = 'all'
      OR COALESCE(up.guarantee_status, 'pending') = p_guarantee_filter
    )
  )
  SELECT base.id, base.email, base.first_name, base.last_name, base.tier_name, base.tier_id,
    base.role_name, base.role_id, base.is_active, base.total_tasks, base.completed_tasks,
    base.progress_percentage, base.created_at, base.last_sign_in_at, base.total_count,
    base.assigned_csm_id, base.onboarding_completed,
    base.onboarding_date, base.offboarding_date, base.guarantee_status, base.onboarding_booking_status
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
    CASE WHEN p_sort_column = 'email' AND v_sort_dir = 'asc' THEN base.email END ASC NULLS LAST,
    CASE WHEN p_sort_column = 'email' AND v_sort_dir = 'desc' THEN base.email END DESC NULLS LAST,
    CASE WHEN p_sort_column = 'last_sign_in_at' AND v_sort_dir = 'asc' THEN base.last_sign_in_at END ASC NULLS LAST,
    CASE WHEN p_sort_column = 'last_sign_in_at' AND v_sort_dir = 'desc' THEN base.last_sign_in_at END DESC NULLS LAST,
    CASE WHEN p_sort_column = 'onboarding_date' AND v_sort_dir = 'asc' THEN base.onboarding_date END ASC NULLS LAST,
    CASE WHEN p_sort_column = 'onboarding_date' AND v_sort_dir = 'desc' THEN base.onboarding_date END DESC NULLS LAST,
    CASE WHEN p_sort_column = 'offboarding_date' AND v_sort_dir = 'asc' THEN base.offboarding_date END ASC NULLS LAST,
    CASE WHEN p_sort_column = 'offboarding_date' AND v_sort_dir = 'desc' THEN base.offboarding_date END DESC NULLS LAST,
    CASE WHEN p_sort_column = 'guarantee_status' AND v_sort_dir = 'asc' THEN base.guarantee_status END ASC NULLS LAST,
    CASE WHEN p_sort_column = 'guarantee_status' AND v_sort_dir = 'desc' THEN base.guarantee_status END DESC NULLS LAST,
    base.created_at DESC NULLS LAST, base.id ASC
  LIMIT p_per_page OFFSET v_offset;
END;
$function$;
