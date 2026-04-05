
CREATE OR REPLACE FUNCTION public.trigger_refresh_leaderboard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM refresh_leaderboard_cache();
  RETURN NEW;
END;
$$;

CREATE TRIGGER refresh_leaderboard_on_points
  AFTER INSERT ON user_points
  FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_leaderboard();

CREATE TRIGGER refresh_leaderboard_on_achievement_badge
  AFTER INSERT ON user_achievement_badges
  FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_leaderboard();

CREATE TRIGGER refresh_leaderboard_on_habit_badge
  AFTER INSERT ON user_habit_badges
  FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_leaderboard();

SELECT refresh_leaderboard_cache();
