-- Step 1: Clean up orphaned records in trader_profiles
-- Delete profiles that don't have a corresponding auth.users entry
DELETE FROM trader_profiles
WHERE id NOT IN (SELECT id FROM auth.users);

-- Step 2: Add foreign key constraints to link tables to auth.users
-- chat_sessions.user_id already exists, ensure it has proper FK constraint
ALTER TABLE chat_sessions
DROP CONSTRAINT IF EXISTS chat_sessions_user_id_fkey,
ADD CONSTRAINT chat_sessions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- trader_profiles.id IS the user UUID, add FK constraint
ALTER TABLE trader_profiles
DROP CONSTRAINT IF EXISTS trader_profiles_id_fkey,
ADD CONSTRAINT trader_profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- weekly_reports.user_id already exists, ensure it has proper FK constraint
ALTER TABLE weekly_reports
DROP CONSTRAINT IF EXISTS weekly_reports_user_id_fkey,
ADD CONSTRAINT weekly_reports_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 3: Create function to auto-populate user_id from auth.uid()
CREATE OR REPLACE FUNCTION public.set_user_id_from_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- Step 4: Create function to auto-populate trader_profiles.id from auth.uid()
CREATE OR REPLACE FUNCTION public.set_trader_profile_id_from_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.id IS NULL THEN
    NEW.id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- Step 5: Create triggers for auto-populating user IDs
DROP TRIGGER IF EXISTS set_user_id_chat_sessions ON chat_sessions;
CREATE TRIGGER set_user_id_chat_sessions
  BEFORE INSERT ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id_from_auth();

DROP TRIGGER IF EXISTS set_user_id_weekly_reports ON weekly_reports;
CREATE TRIGGER set_user_id_weekly_reports
  BEFORE INSERT ON weekly_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id_from_auth();

DROP TRIGGER IF EXISTS set_trader_profile_id ON trader_profiles;
CREATE TRIGGER set_trader_profile_id
  BEFORE INSERT ON trader_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_trader_profile_id_from_auth();