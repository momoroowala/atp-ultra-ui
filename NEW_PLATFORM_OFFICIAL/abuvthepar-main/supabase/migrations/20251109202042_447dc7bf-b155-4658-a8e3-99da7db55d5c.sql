-- Create tier-specific leaderboard function
CREATE OR REPLACE FUNCTION public.get_tier_leaderboard(p_tier_id UUID)
RETURNS TABLE (
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  user_email TEXT,
  total_points INTEGER,
  rank INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_activity_points AS (
    SELECT up.user_id, COALESCE(SUM(up.points), 0) as points
    FROM public.user_points up
    JOIN public.user_profiles prof ON prof.id = up.user_id
    WHERE prof.tier_id = p_tier_id
    GROUP BY up.user_id
  ),
  user_achievement_points AS (
    SELECT uab.user_id, COALESCE(SUM(ab.points_value), 0) as points
    FROM public.user_achievement_badges uab
    JOIN public.achievement_badges ab ON ab.id = uab.badge_id
    JOIN public.user_profiles prof ON prof.id = uab.user_id
    WHERE prof.tier_id = p_tier_id
    GROUP BY uab.user_id
  ),
  user_habit_points AS (
    SELECT uhb.user_id, COALESCE(SUM(hb.points_value), 0) as points
    FROM public.user_habit_badges uhb
    JOIN public.habit_badges hb ON hb.id = uhb.badge_id
    JOIN public.user_profiles prof ON prof.id = uhb.user_id
    WHERE prof.tier_id = p_tier_id
    GROUP BY uhb.user_id
  ),
  tier_users AS (
    SELECT id as user_id FROM public.user_profiles WHERE tier_id = p_tier_id AND is_active = true
  )
  SELECT 
    tu.user_id,
    prof.first_name,
    prof.last_name,
    prof.user_email,
    (
      COALESCE(uap.points, 0) + 
      COALESCE(uachp.points, 0) + 
      COALESCE(uhp.points, 0)
    )::INTEGER as total_points,
    ROW_NUMBER() OVER (
      ORDER BY (
        COALESCE(uap.points, 0) + 
        COALESCE(uachp.points, 0) + 
        COALESCE(uhp.points, 0)
      ) DESC
    )::INTEGER as rank
  FROM tier_users tu
  JOIN public.user_profiles prof ON prof.id = tu.user_id
  LEFT JOIN user_activity_points uap ON uap.user_id = tu.user_id
  LEFT JOIN user_achievement_points uachp ON uachp.user_id = tu.user_id
  LEFT JOIN user_habit_points uhp ON uhp.user_id = tu.user_id
  WHERE (
    COALESCE(uap.points, 0) + 
    COALESCE(uachp.points, 0) + 
    COALESCE(uhp.points, 0)
  ) > 0
  ORDER BY rank
  LIMIT 100;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_tier_leaderboard(UUID) TO authenticated;