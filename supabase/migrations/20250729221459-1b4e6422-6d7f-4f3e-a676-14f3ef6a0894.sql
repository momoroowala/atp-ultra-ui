-- Create prompt_catalog table
CREATE TABLE public.prompt_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  handle TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  archetypes TEXT[] NOT NULL,
  mission TEXT NOT NULL,
  tooltip TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prompt_catalog ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "public read prompts"
ON public.prompt_catalog FOR SELECT USING (true);

-- Create policies for admin management
CREATE POLICY "admin manage prompts"
ON public.prompt_catalog FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_prompt_catalog_updated_at
BEFORE UPDATE ON public.prompt_catalog
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();