import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface TaskResponse {
  id: string;
  task_id: string;
  user_id: string;
  status: string;
  response: any;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useTaskProgress = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['task-progress', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('task_responses')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const responses = data || [];
      const completedCount = responses.filter(r => r.status === 'completed').length;

      return {
        responses: responses as TaskResponse[],
        completedCount,
        totalResponses: responses.length,
      };
    },
    enabled: !!user,
  });
};
