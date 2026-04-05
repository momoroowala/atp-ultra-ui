import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Task {
  id: string;
  phase_id: string;
  title: string;
  description: string | null;
  task_type: string;
  task_order: number;
  content: any;
  content_url: string | null;
  duration_minutes: number | null;
  points: number;
  is_active: boolean;
  visible_tiers: string[];
  unlock_type: string;
  plan_group: string | null;
  show_in_course: boolean;
  created_at: string;
  updated_at: string;
}

export interface Phase {
  id: string;
  title: string;
  description: string | null;
  phase_order: number;
  unlock_type: string;
  unlock_condition: any;
  points: number;
  is_active: boolean;
  visible_tiers: string[];
  created_at: string;
  updated_at: string;
  tasks: Task[];
}

export const usePhasesWithTasks = (courseId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['phases-with-tasks', user?.id, courseId],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('phases')
        .select(`
          *,
          tasks!tasks_phase_id_fkey(*)
        `)
        .eq('is_active', true);

      if (courseId) {
        query = query.eq('course_id', courseId);
      }

      const { data, error } = await query.order('phase_order', { ascending: true });

      if (error) throw error;

      // Filter tasks by is_active and order them
      const phasesWithTasks = (data || []).map(phase => ({
        ...phase,
        tasks: (phase.tasks || [])
          .filter((task: Task) => task.is_active)
          .sort((a: Task, b: Task) => a.task_order - b.task_order)
      }));

      return phasesWithTasks as Phase[];
    },
    enabled: !!user,
  });
};
