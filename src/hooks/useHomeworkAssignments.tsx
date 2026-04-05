import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface HomeworkAssignment {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  points_value: number;
  is_exam: boolean;
  is_active: boolean;
}

export const useHomeworkAssignments = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['homework-assignments', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get all active homework assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('homework_assignments')
        .select('*')
        .order('due_date', { ascending: true });

      if (assignmentsError) throw assignmentsError;
      if (!assignments) return [];

      // Get user's progress for these assignments
      const { data: progress, error: progressError } = await supabase
        .from('user_homework_progress')
        .select('homework_id, status')
        .eq('user_id', user.id);

      if (progressError) throw progressError;

      // Filter to only pending homework
      return assignments.filter(hw => {
        const hwProgress = progress?.find(p => p.homework_id === hw.id);
        return !hwProgress || hwProgress.status === 'pending';
      });
    },
    enabled: !!user,
    staleTime: 120000,
    gcTime: 300000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
};
