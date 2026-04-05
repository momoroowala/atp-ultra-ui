import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Play, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

interface LastLesson {
  module_id: string;
  course_id: string;
  lesson_title: string;
  last_accessed_at: string;
}

export const ResumeButton = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: lastLesson } = useQuery({
    queryKey: ['last-lesson', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data } = await supabase
        .from('course_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('last_accessed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return data as LastLesson | null;
    },
    enabled: !!user,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: null,
  });

  const handleResume = () => {
    if (lastLesson && lastLesson.course_id && lastLesson.module_id) {
      navigate(`/courses/${lastLesson.course_id}/modules/${lastLesson.module_id}`);
    } else {
      navigate('/courses');
    }
  };

  return (
    <Button 
      className="
        mt-2
        w-full
        hover-lift
        active:scale-[0.98] active:translate-y-0
        text-lg
      " 
      size="lg"
      onClick={handleResume}
    >
      <Play className="mr-2 h-5 w-5" />
      {lastLesson ? `Continue: ${lastLesson.lesson_title}` : 'Start Learning'}
    </Button>
  );
};
