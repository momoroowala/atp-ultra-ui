-- Create micro_lessons table in traderassist-prod project
CREATE TABLE public.micro_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  source_url TEXT,
  citation TEXT NOT NULL,
  archetype TEXT NOT NULL,
  lesson_text TEXT NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.micro_lessons ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "public read" 
ON public.micro_lessons 
FOR SELECT 
USING (true);

-- Create function to update timestamps (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_micro_lessons_updated_at
BEFORE UPDATE ON public.micro_lessons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();