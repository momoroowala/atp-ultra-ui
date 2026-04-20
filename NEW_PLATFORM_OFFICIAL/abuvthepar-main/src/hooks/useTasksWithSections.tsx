import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useTasksWithSections = (courseId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tasks-with-sections', user?.id, courseId],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // If courseId provided, first get phase IDs for that course
      let phaseIds: string[] | null = null;
      if (courseId) {
        const { data: phaseData, error: phaseError } = await supabase
          .from('phases')
          .select('id')
          .eq('course_id', courseId)
          .eq('is_active', true);
        if (phaseError) throw phaseError;
        phaseIds = (phaseData || []).map(p => p.id);
      }

      // Fetch tasks with phases, sections, form fields, and responses
      let tasksQuery = supabase
        .from('tasks')
        .select(`
          *,
          phases!tasks_phase_id_fkey(
            id,
            title,
            phase_order,
            unlock_type,
            unlock_condition
          )
        `)
        .eq('is_active', true);

      if (phaseIds && phaseIds.length > 0) {
        tasksQuery = tasksQuery.in('phase_id', phaseIds);
      } else if (phaseIds && phaseIds.length === 0) {
        // No phases for this course, return empty
        return { tasks: [], allFormFields: [], allSubmissions: [] };
      }

      const { data: tasksData, error: tasksError } = await tasksQuery.order('task_order', { ascending: true });

      if (tasksError) throw tasksError;

      // Fetch all sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('discipline_task_sections')
        .select('*')
        .order('order_index', { ascending: true });

      if (sectionsError) throw sectionsError;

      // Fetch all form fields
      const { data: formFieldsData, error: formFieldsError } = await supabase
        .from('discipline_task_form_fields')
        .select('*')
        .order('order_index', { ascending: true });

      if (formFieldsError) throw formFieldsError;

      // Fetch user's task responses
      const { data: responsesData, error: responsesError } = await supabase
        .from('task_responses')
        .select('*')
        .eq('user_id', user.id);

      if (responsesError) throw responsesError;

      // Fetch user's submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('user_task_submissions')
        .select('*')
        .eq('user_id', user.id);

      if (submissionsError) throw submissionsError;

      // Combine data
      const tasks = (tasksData || []).map((task) => ({
        ...task,
        sections: (sectionsData || []).filter((s) => s.task_id === task.id),
        formFields: (formFieldsData || []).filter((f) => f.task_id === task.id),
        response: (responsesData || []).find((r) => r.task_id === task.id),
        submission: (submissionsData || []).find((s) => s.task_id === task.id),
      }));

      return {
        tasks,
        allFormFields: formFieldsData || [],
        allSubmissions: submissionsData || [],
      };
    },
    enabled: !!user,
  });
};
