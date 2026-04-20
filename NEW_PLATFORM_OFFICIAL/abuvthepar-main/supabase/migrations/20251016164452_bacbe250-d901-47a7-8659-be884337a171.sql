-- 1) Ensure unique constraints required by ON CONFLICT clauses exist
-- user_habit_completions: unique (user_id, habit_task_id, assigned_date)
CREATE UNIQUE INDEX IF NOT EXISTS user_habit_completions_user_date_task_idx 
ON public.user_habit_completions (user_id, habit_task_id, assigned_date);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_habit_completions_user_id_habit_task_id_assigned_date_key'
  ) THEN
    ALTER TABLE public.user_habit_completions
    ADD CONSTRAINT user_habit_completions_user_id_habit_task_id_assigned_date_key
    UNIQUE USING INDEX user_habit_completions_user_date_task_idx;
  END IF;
END $$;

-- user_custom_habits: unique (user_id, task_name)
CREATE UNIQUE INDEX IF NOT EXISTS user_custom_habits_user_task_idx 
ON public.user_custom_habits (user_id, task_name);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_custom_habits_user_id_task_name_key'
  ) THEN
    ALTER TABLE public.user_custom_habits
    ADD CONSTRAINT user_custom_habits_user_id_task_name_key
    UNIQUE USING INDEX user_custom_habits_user_task_idx;
  END IF;
END $$;

-- 2) Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_habit_completions_user_completed_date 
ON public.user_habit_completions (user_id, completed, assigned_date);

CREATE INDEX IF NOT EXISTS idx_user_custom_habits_user_active 
ON public.user_custom_habits (user_id, is_active, order_index);

-- 3) Realtime reliability
ALTER TABLE public.user_habit_completions REPLICA IDENTITY FULL;
ALTER TABLE public.user_custom_habits REPLICA IDENTITY FULL;

-- 4) Seed defaults automatically when a profile row is created (day one)
-- Create trigger on user_profiles to invoke seed_habits_on_profile_creation
DROP TRIGGER IF EXISTS trg_seed_habits_on_profile_creation ON public.user_profiles;
CREATE TRIGGER trg_seed_habits_on_profile_creation
AFTER INSERT ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.seed_habits_on_profile_creation();

-- 5) Auto-fill user_id on inserts if missing (smoother RLS)
DROP TRIGGER IF EXISTS trg_set_user_id_uhc ON public.user_habit_completions;
CREATE TRIGGER trg_set_user_id_uhc
BEFORE INSERT ON public.user_habit_completions
FOR EACH ROW
EXECUTE FUNCTION public.set_user_id_from_auth();

DROP TRIGGER IF EXISTS trg_set_user_id_uch ON public.user_custom_habits;
CREATE TRIGGER trg_set_user_id_uch
BEFORE INSERT ON public.user_custom_habits
FOR EACH ROW
EXECUTE FUNCTION public.set_user_id_from_auth();

-- 6) Harden RLS policies with fully-qualified column refs
-- user_habit_completions
DROP POLICY IF EXISTS "Users can view own habit completions" ON public.user_habit_completions;
CREATE POLICY "Users can view own habit completions"
ON public.user_habit_completions
FOR SELECT
TO authenticated
USING (auth.uid() = public.user_habit_completions.user_id);

DROP POLICY IF EXISTS "Users can insert own habit completions" ON public.user_habit_completions;
CREATE POLICY "Users can insert own habit completions"
ON public.user_habit_completions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = public.user_habit_completions.user_id);

DROP POLICY IF EXISTS "Users can update own habit completions" ON public.user_habit_completions;
CREATE POLICY "Users can update own habit completions"
ON public.user_habit_completions
FOR UPDATE
TO authenticated
USING (auth.uid() = public.user_habit_completions.user_id);

DROP POLICY IF EXISTS "Users can delete own habit completions" ON public.user_habit_completions;
CREATE POLICY "Users can delete own habit completions"
ON public.user_habit_completions
FOR DELETE
TO authenticated
USING (auth.uid() = public.user_habit_completions.user_id);

-- user_custom_habits
DROP POLICY IF EXISTS "Users can view own custom habits" ON public.user_custom_habits;
CREATE POLICY "Users can view own custom habits"
ON public.user_custom_habits
FOR SELECT
TO authenticated
USING (auth.uid() = public.user_custom_habits.user_id);

DROP POLICY IF EXISTS "Users can insert own custom habits" ON public.user_custom_habits;
CREATE POLICY "Users can insert own custom habits"
ON public.user_custom_habits
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = public.user_custom_habits.user_id);

DROP POLICY IF EXISTS "Users can update own custom habits" ON public.user_custom_habits;
CREATE POLICY "Users can update own custom habits"
ON public.user_custom_habits
FOR UPDATE
TO authenticated
USING (auth.uid() = public.user_custom_habits.user_id);

DROP POLICY IF EXISTS "Users can delete own custom habits" ON public.user_custom_habits;
CREATE POLICY "Users can delete own custom habits"
ON public.user_custom_habits
FOR DELETE
TO authenticated
USING (auth.uid() = public.user_custom_habits.user_id);

-- 7) View: ensure security invoker for joining task names/order
CREATE OR REPLACE VIEW public.user_habit_items_v
WITH (security_invoker = true) AS
SELECT
  uhc.id,
  uhc.user_id,
  uhc.habit_task_id,
  uhc.assigned_date,
  uhc.completed,
  uhc.completed_at,
  COALESCE(uch.task_name, htt.task_name) AS task_name,
  COALESCE(uch.order_index, htt.order_index) AS order_index
FROM public.user_habit_completions uhc
LEFT JOIN public.user_custom_habits uch
  ON uch.id = uhc.habit_task_id AND uch.user_id = uhc.user_id
LEFT JOIN public.habit_tracker_tasks htt
  ON htt.id = uhc.habit_task_id;

-- 8) Update RPC to use unambiguous ON CONFLICT
CREATE OR REPLACE FUNCTION public.assign_and_get_daily_habits(_user_id uuid, _target_date date)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  habit_task_id uuid,
  assigned_date date,
  completed boolean,
  completed_at timestamptz,
  task_name text,
  order_index integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security check
  IF _user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Ensure user has custom habits (seed if first time)
  IF NOT EXISTS (
    SELECT 1 FROM public.user_custom_habits 
    WHERE user_id = _user_id AND is_active = true
  ) THEN
    PERFORM public.seed_user_default_habits(_user_id);
  END IF;

  -- Insert habits for target date from user's custom habits
  INSERT INTO public.user_habit_completions (user_id, habit_task_id, assigned_date)
  SELECT _user_id, id, _target_date
  FROM public.user_custom_habits
  WHERE user_id = _user_id AND is_active = true
  ON CONFLICT ON CONSTRAINT user_habit_completions_user_id_habit_task_id_assigned_date_key DO NOTHING;
  
  -- Return all habits for that date with task info
  RETURN QUERY
  SELECT v.* 
  FROM public.user_habit_items_v v
  WHERE v.user_id = _user_id AND v.assigned_date = _target_date
  ORDER BY v.order_index;
END;
$$;

-- 9) Keep seed and reset functions as previously fixed (idempotent redefinition)
CREATE OR REPLACE FUNCTION public.seed_user_default_habits(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_custom_habits (user_id, task_name, description, order_index)
  SELECT _user_id, task_name, description, order_index
  FROM public.habit_tracker_tasks
  WHERE is_active = true
  ON CONFLICT (user_id, task_name)
  DO UPDATE SET 
    is_active = true,
    order_index = EXCLUDED.order_index,
    description = EXCLUDED.description,
    updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_user_habits_to_defaults(_user_id uuid)
RETURNS SETOF public.user_custom_habits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Security check
  IF _user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Deactivate all current habits
  UPDATE public.user_custom_habits
  SET is_active = false, updated_at = NOW()
  WHERE user_id = _user_id;

  -- Seed/reactivate defaults
  PERFORM public.seed_user_default_habits(_user_id);

  -- Return the active habits
  RETURN QUERY
  SELECT * FROM public.user_custom_habits
  WHERE user_id = _user_id AND is_active = true
  ORDER BY order_index;
END;
$$;