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

interface CourseTaskMeta {
  id: string;
  title: string;
  description?: string | null;
  points?: number;
  duration_minutes?: number | null;
  task_order: number;
  phase_id: string;
  linked_module_id?: string | null;
}

interface CoursePhase {
  id: string;
  title: string;
  phase_order: number;
  course_id: string;
}

interface CourseResponse {
  task_id: string;
  status: string;
  completed_at: string | null;
}

/**
 * Optimized useInlineTaskDetail — only fetches sections + submissions.
 * Task metadata, phase info, and response status come from the course-detail cache.
 */
export const useInlineTaskDetail = (
  taskId: string | null,
  courseData?: {
    tasks?: CourseTaskMeta[];
    phases?: CoursePhase[];
    responses?: CourseResponse[];
  } | null
) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['inline-task-detail', taskId, user?.id],
    queryFn: async (): Promise<InlineTaskData | null> => {
      if (!taskId || !user) return null;

      // Get task metadata from course cache if available
      const cachedTask = courseData?.tasks?.find(t => t.id === taskId);
      const cachedPhase = cachedTask
        ? courseData?.phases?.find(p => p.id === cachedTask.phase_id)
        : null;
      const cachedResponse = courseData?.responses?.find(r => r.task_id === taskId);

      // Only fetch sections + submissions (the data NOT in course cache)
      const [sectionsResult, submissionResult] = await Promise.all([
        supabase
          .from('discipline_task_sections')
          .select('id, section_type, title, data')
          .eq('task_id', taskId)
          .order('order_index', { ascending: true }),
        supabase
          .from('user_task_submissions' as any)
          .select('*')
          .eq('task_id', taskId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1),
      ]);

      if (sectionsResult.error) throw sectionsResult.error;

      const submissionRows = submissionResult.data;
      const submissionData = submissionRows && submissionRows.length > 0 ? (submissionRows[0] as any) : null;

      // If we have cached data, use it; otherwise fall back to fetching
      if (cachedTask && cachedPhase) {
        const totalTasks = courseData?.tasks?.filter(t => t.phase_id === cachedTask.phase_id).length || 0;

        return {
          id: cachedTask.id,
          title: cachedTask.title,
          description: cachedTask.description || null,
          points: cachedTask.points || 0,
          duration_minutes: cachedTask.duration_minutes || null,
          course_id: cachedPhase.course_id,
          phase_title: cachedPhase.title,
          phase_order: cachedPhase.phase_order,
          task_order: cachedTask.task_order,
          total_tasks: totalTasks,
          linked_module_id: cachedTask.linked_module_id || null,
          sections: sectionsResult.data || [],
          response: cachedResponse ? { status: cachedResponse.status, completed_at: cachedResponse.completed_at } : null,
          submission: submissionData ? {
            data: (submissionData.submission_data || submissionData.response || {}) as Record<string, any>,
            created_at: submissionData.submitted_at || submissionData.created_at || '',
          } : null,
        };
      }

      // Fallback: fetch task + phase from DB (when used outside course context)
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('id, title, description, points, duration_minutes, task_order, phase_id, linked_module_id')
        .eq('id', taskId)
        .maybeSingle();

      if (taskError) throw taskError;
      if (!taskData) return null;

      const { data: phaseData, error: phaseError } = await supabase
        .from('phases')
        .select('id, title, phase_order, course_id')
        .eq('id', taskData.phase_id)
        .single();

      if (phaseError || !phaseData) throw phaseError || new Error('Phase not found');

      const { count: totalTasks } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('phase_id', taskData.phase_id)
        .eq('is_active', true);

      const { data: responseData } = await supabase
        .from('task_responses')
        .select('status, completed_at')
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .maybeSingle();

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
        sections: sectionsResult.data || [],
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
