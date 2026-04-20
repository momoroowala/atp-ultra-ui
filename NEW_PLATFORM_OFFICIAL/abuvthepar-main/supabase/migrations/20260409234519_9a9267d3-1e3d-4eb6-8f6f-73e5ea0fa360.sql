
-- Add new columns to client_action_items
ALTER TABLE public.client_action_items
  ADD COLUMN due_date date,
  ADD COLUMN completed_at timestamptz;

-- Trigger function to auto-manage completed_at
CREATE OR REPLACE FUNCTION public.handle_action_item_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_completed = true AND (OLD.is_completed = false OR OLD.is_completed IS NULL) THEN
    NEW.completed_at := now();
  ELSIF NEW.is_completed = false AND OLD.is_completed = true THEN
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_action_item_completed_at
  BEFORE UPDATE ON public.client_action_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_action_item_completed_at();
