-- Create secure RPC function to award points for task completion
create or replace function public.award_points_for_task(
  p_task_id uuid,
  p_points int,
  p_description text,
  p_activity_type text default 'task_completion'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_exists boolean;
  v_id uuid;
begin
  -- Require authentication
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Require completed task
  perform 1 from task_responses
   where user_id = v_user_id 
     and task_id = p_task_id 
     and status = 'completed'
   limit 1;
  
  if not found then
    raise exception 'Task not completed yet';
  end if;

  -- Idempotency: skip if already awarded for same type+description
  select exists(
    select 1 from user_points
     where user_id = v_user_id
       and activity_type = p_activity_type
       and activity_description = p_description
  ) into v_exists;

  if v_exists then
    -- Return null to indicate no-op (already awarded)
    return null;
  end if;

  -- Insert points
  insert into user_points (user_id, points, activity_type, activity_description)
  values (v_user_id, p_points, p_activity_type, p_description)
  returning id into v_id;

  return v_id;
end;
$$;