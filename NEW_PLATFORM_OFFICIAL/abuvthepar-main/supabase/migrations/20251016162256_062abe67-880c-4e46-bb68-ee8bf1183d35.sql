-- Drop the view and recreate without SECURITY DEFINER
-- The view will rely on the base table RLS policies instead
DROP VIEW IF EXISTS user_habit_items_v;

CREATE VIEW user_habit_items_v 
WITH (security_invoker=true) AS
SELECT
  uhc.id,
  uhc.user_id,
  uhc.habit_task_id,
  uhc.assigned_date,
  uhc.completed,
  uhc.completed_at,
  COALESCE(uch.task_name, htt.task_name) AS task_name,
  COALESCE(uch.order_index, htt.order_index) AS order_index
FROM user_habit_completions uhc
LEFT JOIN user_custom_habits uch ON uch.id = uhc.habit_task_id AND uch.user_id = uhc.user_id
LEFT JOIN habit_tracker_tasks htt ON htt.id = uhc.habit_task_id;