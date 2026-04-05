import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useTaskDetail = (taskId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['task-detail', taskId, user?.id],
    queryFn: async () => {
      if (!taskId) throw new Error('Task ID is required');
      if (!user) throw new Error('User not authenticated');

      // Fetch the specific task with its phase
      const { data: taskData, error: taskError } = await supabase
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
        .eq('id', taskId)
        .eq('is_active', true)
        .single();

      if (taskError) throw taskError;
      if (!taskData) throw new Error('Task not found');

      // Fetch sections for this task only
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('discipline_task_sections')
        .select('*')
        .eq('task_id', taskId)
        .order('order_index', { ascending: true });

      if (sectionsError) throw sectionsError;

      // Fetch form fields for this task only
      const { data: formFieldsData, error: formFieldsError } = await supabase
        .from('discipline_task_form_fields')
        .select('*')
        .eq('task_id', taskId)
        .order('order_index', { ascending: true });

      if (formFieldsError) throw formFieldsError;

      // Fetch user's response for this task
      const { data: responseData, error: responseError } = await supabase
        .from('task_responses')
        .select('*')
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (responseError) throw responseError;

      // Fetch user's submission for this task
      const { data: submissionData, error: submissionError } = await supabase
        .from('user_task_submissions')
        .select('*')
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (submissionError) throw submissionError;

      return {
        task: {
          ...taskData,
          sections: sectionsData || [],
          formFields: formFieldsData || [],
          response: responseData,
          submission: submissionData,
        },
      };
    },
    enabled: !!taskId && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
};
