import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const usePhaseUnlockStatus = (phaseIds: string[]) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['phase-unlock-status', user?.id, phaseIds],
    queryFn: async () => {
      if (!user || phaseIds.length === 0) return {};

      const unlockStatusMap: Record<string, boolean> = {};

      // Check unlock status for each phase using the database function
      for (const phaseId of phaseIds) {
        const { data, error } = await supabase
          .rpc('is_phase_unlocked', {
            _phase_id: phaseId,
            _user_id: user.id
          });

        if (!error) {
          unlockStatusMap[phaseId] = data || false;
        }
      }

      return unlockStatusMap;
    },
    enabled: !!user && phaseIds.length > 0,
  });
};
