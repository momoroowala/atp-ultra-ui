import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useUserTier = () => {
  const { user, loading: authLoading } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['user-tier', user?.id],
    queryFn: async () => {
      if (!user) return null;

      try {
        // First, get user's tier_id from user_profiles
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('tier_id, tiers!inner(tier_key, display_name)')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') throw profileError;

        if (profileData?.tier_id && profileData.tiers) {
          const tierData = Array.isArray(profileData.tiers) ? profileData.tiers[0] : profileData.tiers;
          return {
            tierId: profileData.tier_id,
            tierKey: tierData.tier_key,
            tierName: tierData.display_name,
          };
          } else {
            // No tier assigned - return nulls to enforce locked state
            return {
              tierId: null,
              tierKey: null,
              tierName: null,
            };
          }
       } catch (error) {
         console.error('Error fetching user tier:', error);
         return {
           tierId: null,
           tierKey: null,
           tierName: null,
         };
       }
    },
    enabled: !!user && !authLoading,
    // Inherit global cache settings from App.tsx
  });

  return {
    tierId: data?.tierId ?? null,
    tier: data?.tierKey ?? null,
    tierKey: data?.tierKey ?? null,
    tierName: data?.tierName ?? null,
    loading: isLoading || authLoading,
    isSTBClient: data?.tierKey === 'client_stb',
    isMidTicket: data?.tierKey === 'client_midticket',
  };
};
