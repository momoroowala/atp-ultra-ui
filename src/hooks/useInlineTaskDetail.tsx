import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface InlineTaskData {
  id: string;
  title: string;
  description: string | null;
  points: number;
  duration_minutes: number | null;
  course_id: string;
  phase_title: string;
  phase_order: number;
  task_order: number;
  total_tasks: number;
  linked_module_id: string | null;
  sections: {
    id: string;
    section_type: string;
    title: string | null;
    data: any;
  }[];
  response?: {
    status: string;
    completed_at: string | null;
  } | null;
  submission?: {
    data: Record<string, any>;
    created_at: string;
  } | null;
}

export const useInlineTaskDetail = (taskId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['inline-task-detail', taskId, user?.id],
    queryFn: async (): Promise<InlineTaskData | null> => {
      if (!taskId || !user) return null;

      // Fetch task with phase info
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          points,
          duration_minutes,
          task_order,
          phase_id,
          linked_module_id
        `)
        .eq('id', taskId)
        .maybeSingle();

      if (taskError) throw taskError;
      if (!taskData) return null;

      // Fetch phase info separately
      const { data: phaseData, error: phaseError } = await supabase
        .from('phases')
        .select('id, title, phase_order, course_id')
        .eq('id', taskData.phase_id)
        .single();

      if (phaseError || !phaseData) throw phaseError || new Error('Phase not found');

      // Get total tasks in this phase
      const { count: totalTasks } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('phase_id', taskData.phase_id)
        .eq('is_active', true);

      // Fetch sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('discipline_task_sections')
        .select('id, section_type, title, data')
        .eq('task_id', taskId)
        .order('order_index', { ascending: true });

      if (sectionsError) throw sectionsError;

      // Fetch user response
      const { data: responseData } = await supabase
        .from('task_responses')
        .select('status, completed_at')
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .maybeSingle();

      // Fetch submission if exists
      const { data: submissionRows } = await supabase
        .from('user_task_submissions' as any)
        .select('*')
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const submissionData = submissionRows && submissionRows.length > 0 ? (submissionRows[0] as any) : null;

      return {
        id: taskData.id,
        title: taskData.title,
        description: taskData.description,
        points: taskData.points,
        duration_minutes: taskData.duration_minutes,
        course_id: phaseData.course_id,
        phase_title: phaseData.title,
        phase_order: phaseData.phase_order,
        task_order: taskData.task_order,
        total_tasks: totalTasks || 0,
        linked_module_id: (taskData as any).linked_module_id || null,
        sections: sectionsData || [],
        response: responseData,
        submission: submissionData ? {
          data: (submissionData.submission_data || submissionData.response || {}) as Record<string, any>,
          created_at: submissionData.submitted_at || submissionData.created_at || '',
        } : null,
      };
    },
    enabled: !!taskId && !!user,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
