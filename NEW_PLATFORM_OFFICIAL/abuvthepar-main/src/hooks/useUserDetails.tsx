import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useUserDetails = (userId: string) => {
  return useQuery({
    queryKey: ['user-details', userId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-user-detail', {
        body: { userId }
      });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useSaveAdminNotes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, notes }: { userId: string; notes: string }) => {
      const { error } = await supabase
        .from('user_profiles')
        .update({ admin_notes: notes } as any)
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user-details', userId] });
    },
  });
};

export const useSaveOnboardingDetails = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, details }: { userId: string; details: Record<string, any> }) => {
      const { error } = await supabase
        .from('user_profiles')
        .update(details as any)
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user-details', userId] });
    },
  });
};
