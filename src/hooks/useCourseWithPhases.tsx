import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useCourseWithPhases = (courseId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['course-with-phases', courseId, user?.id],
    queryFn: async () => {
      if (!courseId) throw new Error('Course ID is required');

      // Fetch course
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      // Check access
      const { data: hasAccess, error: accessError } = await supabase
        .rpc('has_course_access', {
          _user_id: user!.id,
          _course_id: courseId,
        });

      if (accessError) {
        console.error('Error checking access:', accessError);
      }

      if (!hasAccess) {
        return { ...course, hasAccess: false, phases: [] };
      }

      // Fetch phases for this course (without tasks for faster initial load)
      const { data: phases, error: phasesError } = await supabase
        .from('phases')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_active', true)
        .order('phase_order');

      if (phasesError) throw phasesError;

      return {
        ...course,
        hasAccess: true,
        phases: (phases || []).map(phase => ({ ...phase, tasks: [] })),
      };
    },
    enabled: !!user && !!courseId,
  });
};
