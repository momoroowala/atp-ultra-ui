-- Create micro_lessons table for storing trading lesson content
CREATE TABLE public.micro_lessons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    archetype TEXT NOT NULL,
    lesson_text TEXT NOT NULL,
    citation TEXT NOT NULL,
    source_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.micro_lessons ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (lessons are publicly accessible)
CREATE POLICY "Anyone can view micro lessons" 
    ON public.micro_lessons 
    FOR SELECT 
    USING (true);

-- Only authenticated users can insert/update/delete (for admin purposes)
CREATE POLICY "Authenticated users can insert micro lessons" 
    ON public.micro_lessons 
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update micro lessons" 
    ON public.micro_lessons 
    FOR UPDATE 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete micro lessons" 
    ON public.micro_lessons 
    FOR DELETE 
    USING (auth.role() = 'authenticated');

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