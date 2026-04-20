import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface CurrentUserProfile {
  first_name: string | null;
  last_name: string | null;
  onboarding_completed: boolean | null;
  tier_id: string | null;
  tier_key: string | null;
  tier_display_name: string | null;
  tier_upsell_funnel_url: string | null;
}

export const useCurrentUserProfile = () => {
  const { user, loading: authLoading } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['current-user-profile', user?.id],
    queryFn: async (): Promise<CurrentUserProfile> => {
      if (!user) throw new Error('No user');

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, onboarding_completed, tier_id, tiers!inner(tier_key, display_name, upsell_funnel_url)')
        .eq('id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (!profile) {
        return {
          first_name: null,
          last_name: null,
          onboarding_completed: null,
          tier_id: null,
          tier_key: null,
          tier_display_name: null,
          tier_upsell_funnel_url: null,
        };
      }

      const tierData = profile.tiers
        ? Array.isArray(profile.tiers) ? profile.tiers[0] : profile.tiers
        : null;

      return {
        first_name: (profile as any).first_name ?? null,
        last_name: (profile as any).last_name ?? null,
        onboarding_completed: (profile as any).onboarding_completed ?? null,
        tier_id: (profile as any).tier_id ?? null,
        tier_key: tierData?.tier_key ?? null,
        tier_display_name: tierData?.display_name ?? null,
        tier_upsell_funnel_url: tierData?.upsell_funnel_url ?? null,
      };
    },
    enabled: !!user && !authLoading,
    staleTime: 2 * 60 * 1000,
  });

  return {
    profile: data ?? null,
    isLoading: isLoading || authLoading,
  };
};
