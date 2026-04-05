-- Create table for daily ad entries
CREATE TABLE public.daily_ad_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL,
  spend NUMERIC,
  clicks INTEGER,
  ctr NUMERIC,
  cpm NUMERIC,
  cpc NUMERIC,
  add_to_carts INTEGER,
  campaign_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT daily_ad_entries_unique_user_date UNIQUE (user_id, entry_date)
);

-- Enable Row Level Security
ALTER TABLE public.daily_ad_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own ad entries" 
ON public.daily_ad_entries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ad entries" 
ON public.daily_ad_entries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ad entries" 
ON public.daily_ad_entries 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ad entries" 
ON public.daily_ad_entries 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_daily_ad_entries_updated_at
BEFORE UPDATE ON public.daily_ad_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();