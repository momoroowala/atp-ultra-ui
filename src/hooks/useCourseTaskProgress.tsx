import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useCourseTaskProgress = (courseId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['course-task-progress', courseId, user?.id],
    queryFn: async () => {
      if (!courseId) throw new Error('Course ID is required');
      if (!user) throw new Error('User not authenticated');

      // Fetch all phases for this course
      const { data: phasesData, error: phasesError } = await supabase
        .from('phases')
        .select('id, title, description, phase_order, unlock_type, unlock_condition, course_id')
        .eq('course_id', courseId)
        .eq('is_active', true)
        .order('phase_order', { ascending: true });

      if (phasesError) throw phasesError;

      const phaseIds = (phasesData || []).map(p => p.id);

      // Fetch all tasks for these phases
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, description, task_order, phase_id, duration_minutes, points, task_type, content')
        .in('phase_id', phaseIds)
        .eq('is_active', true)
        .order('task_order', { ascending: true });

      if (tasksError) throw tasksError;

      // Fetch user's responses for these tasks
      const taskIds = (tasksData || []).map(t => t.id);
      
      // Fetch responses and task sections in parallel
      const [responsesResult, sectionsResult] = await Promise.all([
        supabase
          .from('task_responses')
          .select('task_id, status, completed_at')
          .in('task_id', taskIds)
          .eq('user_id', user.id),
        supabase
          .from('discipline_task_sections')
          .select('task_id, section_type, data')
          .in('task_id', taskIds)
          .eq('section_type', 'video')
      ]);

      if (responsesResult.error) throw responsesResult.error;
      if (sectionsResult.error) throw sectionsResult.error;
      
      const responsesData = responsesResult.data;
      const sectionsData = sectionsResult.data;

      // Group tasks by phase with progress
      const tasksByPhase = (phasesData || []).map(phase => {
        const phaseTasks = (tasksData || []).filter(t => t.phase_id === phase.id);
        const completedTasks = phaseTasks.filter(t => {
          const response = (responsesData || []).find(r => r.task_id === t.id);
          return response?.status === 'completed';
        });

        return {
          phase,
          tasks: phaseTasks,
          totalTasks: phaseTasks.length,
          completedTasks: completedTasks.length,
        };
      });

      // Calculate overall progress
      const totalTasks = tasksData?.length || 0;
      const completedTasks = (responsesData || []).filter(r => r.status === 'completed').length;

      return {
        phases: phasesData || [],
        tasksByPhase,
        totalTasks,
        completedTasks,
        tasks: tasksData || [],
        responses: responsesData || [],
        taskSections: sectionsData || [],
      };
    },
    enabled: !!courseId && !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
};
