CREATE OR REPLACE FUNCTION public.trigger_award_badges_on_lead_create()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM check_and_award_achievement_badges(NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_lead_created_award_badges
  AFTER INSERT ON public.brand_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_award_badges_on_lead_create();