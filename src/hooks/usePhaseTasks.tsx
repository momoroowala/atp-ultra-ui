import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePhaseTasks = (phaseId: string | undefined) => {
  return useQuery({
    queryKey: ['phase-tasks', phaseId],
    queryFn: async () => {
      if (!phaseId) throw new Error('Phase ID is required');

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('phase_id', phaseId)
        .eq('is_active', true)
        .order('task_order');

      if (error) throw error;

      return data || [];
    },
    enabled: !!phaseId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};
