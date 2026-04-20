DROP POLICY IF EXISTS "Authenticated can manage phase quiz requirements" ON public.phase_quiz_requirements;
CREATE POLICY "Authenticated can manage phase quiz requirements"
ON public.phase_quiz_requirements
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);