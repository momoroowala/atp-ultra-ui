import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const usePhaseTasksDetail = (phaseId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['phase-tasks-detail', phaseId, user?.id],
    queryFn: async () => {
      if (!phaseId) throw new Error('Phase ID is required');
      if (!user) throw new Error('User not authenticated');

      // Fetch tasks for this phase with more details
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, description, task_order, phase_id, points, duration_minutes')
        .eq('phase_id', phaseId)
        .eq('is_active', true)
        .order('task_order', { ascending: true });

      if (tasksError) throw tasksError;

      // Fetch user's responses for these tasks
      const taskIds = (tasksData || []).map(t => t.id);
      const { data: responsesData, error: responsesError } = await supabase
        .from('task_responses')
        .select('task_id, status, completed_at')
        .in('task_id', taskIds)
        .eq('user_id', user.id);

      if (responsesError) throw responsesError;

      // Fetch video sections for thumbnails
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('discipline_task_sections')
        .select('task_id, section_type, data')
        .in('task_id', taskIds)
        .eq('section_type', 'video');

      if (sectionsError) throw sectionsError;

      // Map responses and sections to tasks
      const tasks = (tasksData || []).map(task => ({
        ...task,
        response: (responsesData || []).find(r => r.task_id === task.id),
        videoSection: (sectionsData || []).find(s => s.task_id === task.id),
      }));

      return { tasks };
    },
    enabled: !!phaseId && !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
};
