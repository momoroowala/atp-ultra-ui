import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { calculateDueDate, DueDateInfo } from '@/utils/taskDueDateCalculator';

export const useTaskDueDates = () => {
  const { user } = useAuth();

  const { data: userData } = useQuery({
    queryKey: ['user-profile-dates', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .select('created_at')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: phaseCompletions } = useQuery({
    queryKey: ['phase-completions', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Get all task submissions grouped by phase
      const { data: submissions, error } = await supabase
        .from('user_task_submissions')
        .select(`
          created_at,
          task_id,
          tasks!inner(phase_id)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by phase and get latest completion date
      const phaseMap: Record<string, Date> = {};
      (submissions || []).forEach((sub: any) => {
        const phaseId = sub.tasks?.phase_id;
        if (phaseId) {
          const date = new Date(sub.created_at);
          if (!phaseMap[phaseId] || date > phaseMap[phaseId]) {
            phaseMap[phaseId] = date;
          }
        }
      });

      return phaseMap;
    },
    enabled: !!user,
  });

  const calculateTaskDueDate = useMemo(() => {
    return (task: any): DueDateInfo => {
      if (!userData?.created_at) {
        return {
          dueDate: null,
          isOverdue: false,
          isDueToday: false,
          isDueSoon: false,
          timeRemaining: null,
        };
      }

      return calculateDueDate(task, userData.created_at, phaseCompletions || {});
    };
  }, [userData, phaseCompletions]);

  return { calculateTaskDueDate };
};
