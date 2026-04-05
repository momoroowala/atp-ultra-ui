-- Create user_profiles table for extended user information
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  tier TEXT CHECK (tier IN ('DFY', 'DIY', '7 Figure')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Create phases table
CREATE TABLE public.phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  phase_order INTEGER NOT NULL,
  unlock_type TEXT CHECK (unlock_type IN ('previous_task', 'time', 'completion')) DEFAULT 'previous_task',
  unlock_condition JSONB,
  points INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on phases
ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for phases
CREATE POLICY "Everyone can view active phases"
  ON public.phases
  FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage phases"
  ON public.phases
  FOR ALL
  USING (is_admin(auth.uid()));

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID REFERENCES public.phases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT CHECK (task_type IN ('video', 'readout', 'form')) NOT NULL,
  task_order INTEGER NOT NULL,
  content_url TEXT,
  content JSONB,
  duration_minutes INTEGER,
  points INTEGER DEFAULT 50,
  tier TEXT CHECK (tier IN ('DFY', 'DIY', '7 Figure', 'all')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Everyone can view active tasks"
  ON public.tasks
  FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage tasks"
  ON public.tasks
  FOR ALL
  USING (is_admin(auth.uid()));

-- Create task_responses table
CREATE TABLE public.task_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
  response JSONB,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, task_id)
);

-- Enable RLS on task_responses
ALTER TABLE public.task_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_responses
CREATE POLICY "Users can view own task responses"
  ON public.task_responses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own task responses"
  ON public.task_responses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own task responses"
  ON public.task_responses
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all task responses"
  ON public.task_responses
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Create resources table
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT CHECK (resource_type IN ('pdf', 'link', 'guide', 'video')) NOT NULL,
  url TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on resources
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resources
CREATE POLICY "Everyone can view active resources"
  ON public.resources
  FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Operations and Admins can manage resources"
  ON public.resources
  FOR ALL
  USING (
    has_role(auth.uid(), 'operations') OR 
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'mega_admin')
  );

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_phases_updated_at
  BEFORE UPDATE ON public.phases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_responses_updated_at
  BEFORE UPDATE ON public.task_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();