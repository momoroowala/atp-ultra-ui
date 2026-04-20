-- Create quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  linked_phase_ids UUID[] DEFAULT ARRAY[]::UUID[],
  passing_grade NUMERIC NOT NULL DEFAULT 70 CHECK (passing_grade >= 0 AND passing_grade <= 100),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz_questions table
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_order INTEGER NOT NULL,
  answer_options JSONB NOT NULL DEFAULT '[]'::JSONB,
  correct_answer_id TEXT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz_submissions table
CREATE TABLE IF NOT EXISTS public.quiz_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::JSONB,
  score NUMERIC NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  passed BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  attempt_number INTEGER NOT NULL DEFAULT 1
);

-- Create phase_quiz_requirements junction table
CREATE TABLE IF NOT EXISTS public.phase_quiz_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES public.phases(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(phase_id, quiz_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_quiz_id ON public.quiz_submissions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_user_id ON public.quiz_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_phase_quiz_requirements_phase_id ON public.phase_quiz_requirements(phase_id);
CREATE INDEX IF NOT EXISTS idx_phase_quiz_requirements_quiz_id ON public.phase_quiz_requirements(quiz_id);

-- Enable RLS on all tables
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phase_quiz_requirements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quizzes
CREATE POLICY "Admins and ops can manage quizzes"
  ON public.quizzes
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'mega_admin'::app_role) OR 
    has_role(auth.uid(), 'operations'::app_role)
  );

CREATE POLICY "Authenticated users can view active quizzes"
  ON public.quizzes
  FOR SELECT
  USING (is_active = true AND auth.uid() IS NOT NULL);

-- RLS Policies for quiz_questions
CREATE POLICY "Admins and ops can manage questions"
  ON public.quiz_questions
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'mega_admin'::app_role) OR 
    has_role(auth.uid(), 'operations'::app_role)
  );

CREATE POLICY "Authenticated users can view questions for active quizzes"
  ON public.quiz_questions
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE quizzes.id = quiz_questions.quiz_id 
      AND quizzes.is_active = true
    )
  );

-- RLS Policies for quiz_submissions
CREATE POLICY "Users can insert own submissions"
  ON public.quiz_submissions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own submissions"
  ON public.quiz_submissions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins and ops can view all submissions"
  ON public.quiz_submissions
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'mega_admin'::app_role) OR 
    has_role(auth.uid(), 'operations'::app_role)
  );

-- RLS Policies for phase_quiz_requirements
CREATE POLICY "Admins and ops can manage phase quiz requirements"
  ON public.phase_quiz_requirements
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'mega_admin'::app_role) OR 
    has_role(auth.uid(), 'operations'::app_role)
  );

CREATE POLICY "Authenticated users can view phase quiz requirements"
  ON public.phase_quiz_requirements
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at on quizzes
CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on quiz_questions
CREATE TRIGGER update_quiz_questions_updated_at
  BEFORE UPDATE ON public.quiz_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if user has completed required quiz for a phase
CREATE OR REPLACE FUNCTION public.is_phase_quiz_completed(_phase_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _required_quiz_id uuid;
  _passing_grade numeric;
  _user_passed boolean;
BEGIN
  -- Get required quiz for this phase
  SELECT pqr.quiz_id, q.passing_grade 
  INTO _required_quiz_id, _passing_grade
  FROM phase_quiz_requirements pqr
  JOIN quizzes q ON q.id = pqr.quiz_id
  WHERE pqr.phase_id = _phase_id 
    AND pqr.is_required = true
    AND q.is_active = true
  LIMIT 1;
  
  -- If no quiz required, return true
  IF _required_quiz_id IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check if user has passed the quiz
  SELECT EXISTS(
    SELECT 1 FROM quiz_submissions
    WHERE quiz_id = _required_quiz_id
      AND user_id = _user_id
      AND passed = true
      AND score >= _passing_grade
  ) INTO _user_passed;
  
  RETURN COALESCE(_user_passed, false);
END;
$$;

-- Update is_phase_unlocked function to include quiz check
CREATE OR REPLACE FUNCTION public.is_phase_unlocked(_phase_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _phase RECORD;
  _user_created_at TIMESTAMP WITH TIME ZONE;
  _delay_days INTEGER;
  _required_task_id UUID;
  _required_phase_id UUID;
  _is_completed BOOLEAN;
  _quiz_completed BOOLEAN;
BEGIN
  -- Get phase info
  SELECT * INTO _phase FROM phases WHERE id = _phase_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Get user creation date
  SELECT created_at INTO _user_created_at 
  FROM user_profiles 
  WHERE id = _user_id;
  
  IF _user_created_at IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check unlock type
  CASE _phase.unlock_type
    WHEN 'time' THEN
      -- Time-based: check if delay_days have passed since user joined
      _delay_days := COALESCE((_phase.unlock_condition->>'delay_days')::INTEGER, 0);
      _is_completed := CURRENT_DATE >= (_user_created_at::DATE + _delay_days);
    
    WHEN 'previous_task' THEN
      -- Get the previous task/phase ID from unlock_condition
      _required_task_id := (_phase.unlock_condition->>'task_id')::UUID;
      IF _required_task_id IS NOT NULL THEN
        SELECT EXISTS(
          SELECT 1 FROM task_responses 
          WHERE user_id = _user_id 
            AND task_id = _required_task_id 
            AND status = 'completed'
        ) INTO _is_completed;
        _is_completed := COALESCE(_is_completed, FALSE);
      ELSE
        _is_completed := TRUE;
      END IF;
    
    WHEN 'completion' THEN
      -- Check if specific phase is completed
      _required_phase_id := (_phase.unlock_condition->>'phase_id')::UUID;
      IF _required_phase_id IS NOT NULL THEN
        -- Check if all tasks in required phase are completed
        SELECT NOT EXISTS(
          SELECT 1 FROM tasks t
          WHERE t.phase_id = _required_phase_id 
            AND t.is_active = true
            AND NOT EXISTS(
              SELECT 1 FROM task_responses tr
              WHERE tr.task_id = t.id
                AND tr.user_id = _user_id
                AND tr.status = 'completed'
            )
        ) INTO _is_completed;
        _is_completed := COALESCE(_is_completed, FALSE);
      ELSE
        _is_completed := TRUE;
      END IF;
    
    ELSE
      _is_completed := TRUE;
  END CASE;
  
  -- If basic unlock conditions not met, return false
  IF NOT _is_completed THEN
    RETURN FALSE;
  END IF;
  
  -- Check if quiz is completed (if required)
  _quiz_completed := is_phase_quiz_completed(_phase_id, _user_id);
  
  RETURN _is_completed AND _quiz_completed;
END;
$$;