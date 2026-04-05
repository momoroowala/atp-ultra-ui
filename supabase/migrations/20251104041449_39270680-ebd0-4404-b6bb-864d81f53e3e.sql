-- Update refresh_leaderboard_cache function to include all point sources
CREATE OR REPLACE FUNCTION public.refresh_leaderboard_cache()
RETURNS void AS $$
BEGIN
  -- Clear existing cache
  DELETE FROM public.leaderboard_cache;
  
  -- Insert fresh rankings based on all point sources
  INSERT INTO public.leaderboard_cache (user_id, total_points, rank, updated_at)
  WITH user_activity_points AS (
    SELECT user_id, COALESCE(SUM(points), 0) as points
    FROM public.user_points
    GROUP BY user_id
  ),
  user_achievement_points AS (
    SELECT uab.user_id, COALESCE(SUM(ab.points_value), 0) as points
    FROM public.user_achievement_badges uab
    JOIN public.achievement_badges ab ON ab.id = uab.badge_id
    GROUP BY uab.user_id
  ),
  user_habit_points AS (
    SELECT uhb.user_id, COALESCE(SUM(hb.points_value), 0) as points
    FROM public.user_habit_badges uhb
    JOIN public.habit_badges hb ON hb.id = uhb.badge_id
    GROUP BY uhb.user_id
  ),
  all_users AS (
    SELECT user_id FROM user_activity_points
    UNION
    SELECT user_id FROM user_achievement_points
    UNION
    SELECT user_id FROM user_habit_points
  )
  SELECT 
    au.user_id,
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
    )::INTEGER as rank,
    now() as updated_at
  FROM all_users au
  LEFT JOIN user_activity_points uap ON uap.user_id = au.user_id
  LEFT JOIN user_achievement_points uachp ON uachp.user_id = au.user_id
  LEFT JOIN user_habit_points uhp ON uhp.user_id = au.user_id
  WHERE (
    COALESCE(uap.points, 0) + 
    COALESCE(uachp.points, 0) + 
    COALESCE(uhp.points, 0)
  ) > 0
  ORDER BY rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;