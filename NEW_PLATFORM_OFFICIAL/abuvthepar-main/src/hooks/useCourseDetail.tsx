import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useCourseDetail = (courseId: string | undefined) => {
  const { user } = useAuth();
  const validCourseId = courseId && courseId !== 'undefined' ? courseId : undefined;

  return useQuery({
    queryKey: ['course-detail', validCourseId, user?.id],
    queryFn: async () => {
      if (!validCourseId) throw new Error('Course ID is required');
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('get-course-detail', {
        body: { courseId: validCourseId }
      });

      if (error) throw error;
      
      return {
        ...data,
        tasks: data.tasks || [],
        responses: data.responses || [],
        unlockStatusMap: data.unlockStatusMap || {},
      };
    },
    enabled: !!validCourseId && !!user,
    retry: 1,
  });
};
