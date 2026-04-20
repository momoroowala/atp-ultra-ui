import { useCurrentUserProfile } from './useCurrentUserProfile';

export const useUserTier = () => {
  const { profile, isLoading } = useCurrentUserProfile();

  return {
    tierId: profile?.tier_id ?? null,
    tier: profile?.tier_key ?? null,
    tierKey: profile?.tier_key ?? null,
    tierName: profile?.tier_display_name ?? null,
    upsellUrl: profile?.tier_upsell_funnel_url ?? null,
    loading: isLoading,
    isSTBClient: profile?.tier_key === 'client_stb',
    isMidTicket: profile?.tier_key === 'client_midticket',
  };
};
