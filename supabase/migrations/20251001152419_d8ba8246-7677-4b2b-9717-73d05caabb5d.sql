-- Create enum for badge types
CREATE TYPE public.badge_type AS ENUM (
  'onboarding_complete',
  'first_homework',
  'first_community_call',
  'streak_7_days',
  'exam_passed',
  'videos_10_complete',
  'leaderboard_top_10'
);

-- Create enum for onboarding task status
CREATE TYPE public.task_status AS ENUM ('pending', 'completed', 'skipped');

-- User Onboarding Tasks
CREATE TABLE public.user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_key TEXT NOT NULL,
  task_label TEXT NOT NULL,
  status task_status DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, task_key)
);

-- User Badges
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type badge_type NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, badge_type)
);

-- User Streaks
CREATE TABLE public.user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_login_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Points
CREATE TABLE public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  activity_type TEXT NOT NULL,
  activity_description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Announcements
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Homework Assignments
CREATE TABLE public.homework_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  points_value INTEGER DEFAULT 0,
  is_exam BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Homework Progress
CREATE TABLE public.user_homework_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  homework_id UUID NOT NULL REFERENCES homework_assignments(id) ON DELETE CASCADE,
  status task_status DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE,
  score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, homework_id)
);

-- Calendar Events
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  event_type TEXT DEFAULT 'community_call',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Course Progress
CREATE TABLE public.course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  lesson_title TEXT,
  completed BOOLEAN DEFAULT false,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Leaderboard Cache
CREATE TABLE public.leaderboard_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_points INTEGER DEFAULT 0,
  rank INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_homework_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_onboarding
CREATE POLICY "Users can view own onboarding" ON user_onboarding FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own onboarding" ON user_onboarding FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own onboarding" ON user_onboarding FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_badges
CREATE POLICY "Users can view own badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage badges" ON user_badges FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for user_streaks
CREATE POLICY "Users can view own streaks" ON user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own streaks" ON user_streaks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streaks" ON user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_points
CREATE POLICY "Users can view own points" ON user_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage points" ON user_points FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for announcements
CREATE POLICY "All users can view announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY "Admins can manage announcements" ON announcements FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for homework_assignments
CREATE POLICY "All users can view homework" ON homework_assignments FOR SELECT USING (true);
CREATE POLICY "Admins can manage homework" ON homework_assignments FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for user_homework_progress
CREATE POLICY "Users can view own homework progress" ON user_homework_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own homework progress" ON user_homework_progress FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for calendar_events
CREATE POLICY "All users can view calendar events" ON calendar_events FOR SELECT USING (true);
CREATE POLICY "Admins can manage calendar events" ON calendar_events FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for course_progress
CREATE POLICY "Users can view own course progress" ON course_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own course progress" ON course_progress FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for leaderboard_cache
CREATE POLICY "All users can view leaderboard" ON leaderboard_cache FOR SELECT USING (true);
CREATE POLICY "Admins can manage leaderboard" ON leaderboard_cache FOR ALL USING (is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_user_onboarding_user_id ON user_onboarding(user_id);
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX idx_user_points_user_id ON user_points(user_id);
CREATE INDEX idx_user_homework_progress_user_id ON user_homework_progress(user_id);
CREATE INDEX idx_course_progress_user_id ON course_progress(user_id);
CREATE INDEX idx_leaderboard_cache_rank ON leaderboard_cache(rank);
CREATE INDEX idx_calendar_events_date ON calendar_events(event_date);

-- Create trigger for updated_at on relevant tables
CREATE TRIGGER update_user_streaks_updated_at
  BEFORE UPDATE ON user_streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_homework_assignments_updated_at
  BEFORE UPDATE ON homework_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default onboarding tasks
INSERT INTO user_onboarding (user_id, task_key, task_label, status)
SELECT 
  id,
  task_key,
  task_label,
  'pending'::task_status
FROM auth.users
CROSS JOIN (
  VALUES 
    ('schedule_call', 'Schedule Onboarding Call'),
    ('complete_form', 'Complete Form'),
    ('bookmark_roadmap', 'Bookmark Roadmap'),
    ('watch_walkthrough', 'Watch Walkthrough'),
    ('create_tradezella', 'Create Free TradeZella Account (Optional)'),
    ('redeem_apex', 'Redeem Apex Discount (Optional)'),
    ('confirm_access', 'Confirm Resource Access'),
    ('review_inclusions', 'Review Program Inclusions'),
    ('add_call_times', 'Add Call Times'),
    ('see_testimonials', 'See Testimonials'),
    ('success_principles', 'Success Principles'),
    ('faq', 'FAQ')
) AS tasks(task_key, task_label)
ON CONFLICT (user_id, task_key) DO NOTHING;