-- Function to refresh leaderboard cache from user_points
CREATE OR REPLACE FUNCTION public.refresh_leaderboard_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Clear existing cache
  DELETE FROM public.leaderboard_cache;
  
  -- Insert fresh rankings based on user_points
  INSERT INTO public.leaderboard_cache (user_id, total_points, rank, updated_at)
  SELECT 
    user_id,
    SUM(points)::INTEGER as total_points,
    ROW_NUMBER() OVER (ORDER BY SUM(points) DESC)::INTEGER as rank,
    now() as updated_at
  FROM public.user_points
  GROUP BY user_id
  HAVING SUM(points) > 0
  ORDER BY rank;
END;
$function$;

-- Populate the cache immediately
SELECT public.refresh_leaderboard_cache();