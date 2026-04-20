import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useAssignedCSM = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['assigned-csm', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get the current user's assigned_csm_id
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('assigned_csm_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile?.assigned_csm_id) return null;

      const assignedCsmId = profile.assigned_csm_id as string;

      // Attempt to fetch the CSM's profile (may fail due to RLS)
      const { data: csmProfile } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('id', assignedCsmId)
        .maybeSingle();

      const fullName = csmProfile
        ? `${csmProfile.first_name || ''} ${csmProfile.last_name || ''}`.trim()
        : '';

      return {
        csmId: assignedCsmId,
        csmName: fullName || 'Your CSM',
        csmAvatar: (csmProfile?.avatar_url as string | null) ?? null,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    csmId: data?.csmId ?? null,
    csmName: data?.csmName ?? null,
    csmAvatar: data?.csmAvatar ?? null,
    isLoading,
  };
};
