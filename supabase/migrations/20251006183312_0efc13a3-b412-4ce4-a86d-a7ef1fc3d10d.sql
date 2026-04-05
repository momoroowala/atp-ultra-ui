-- Step 1: Create new enum type with correct order
CREATE TYPE milestone_type_new AS ENUM (
  'onboarding_complete',
  'first_live_call',
  'first_green_day',
  'first_funded_account',
  'first_payout',
  '5k_month',
  'program_complete'
);

-- Step 2: Update user_milestones table to use new enum
ALTER TABLE public.user_milestones 
  ALTER COLUMN milestone_type TYPE milestone_type_new 
  USING milestone_type::text::milestone_type_new;

-- Step 3: Drop old enum and rename new one
DROP TYPE milestone_type;
ALTER TYPE milestone_type_new RENAME TO milestone_type;

-- Step 4: Create function to auto-complete onboarding milestone
CREATE OR REPLACE FUNCTION public.mark_onboarding_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the onboarding milestone to completed when profile is created
  UPDATE public.user_milestones
  SET 
    completed = true,
    completed_at = NOW()
  WHERE 
    user_id = NEW.id 
    AND milestone_type = 'onboarding_complete'
    AND completed = false;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 5: Create trigger on trader_profiles
CREATE TRIGGER on_trader_profile_created
  AFTER INSERT ON public.trader_profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.mark_onboarding_complete();

-- Step 6: Backfill existing users who have completed trader profiles
UPDATE public.user_milestones um
SET 
  completed = true,
  completed_at = COALESCE(tp.created_at, NOW())
FROM public.trader_profiles tp
WHERE 
  um.user_id = tp.id
  AND um.milestone_type = 'onboarding_complete'
  AND um.completed = false;