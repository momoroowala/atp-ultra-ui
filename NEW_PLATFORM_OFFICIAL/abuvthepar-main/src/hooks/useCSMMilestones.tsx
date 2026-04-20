import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CSMMilestone {
  id: string;
  title: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export const useCSMMilestones = (clientUserId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: milestones = [], isLoading: milestonesLoading } = useQuery({
    queryKey: ['csm-milestones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('csm_milestones' as any)
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return (data as any[]) as CSMMilestone[];
    },
  });

  const { data: completedIds = [], isLoading: completionsLoading } = useQuery({
    queryKey: ['csm-milestone-completions', clientUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('csm_milestone_completions' as any)
        .select('milestone_id')
        .eq('client_user_id', clientUserId);
      if (error) throw error;
      return (data as any[]).map((r: any) => r.milestone_id as string);
    },
    enabled: !!clientUserId,
  });

  const toggleMilestone = useMutation({
    mutationFn: async (milestoneId: string) => {
      if (!user) throw new Error('Not authenticated');
      const isCompleted = completedIds.includes(milestoneId);
      if (isCompleted) {
        const { error } = await supabase
          .from('csm_milestone_completions' as any)
          .delete()
          .eq('client_user_id', clientUserId)
          .eq('milestone_id', milestoneId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('csm_milestone_completions' as any)
          .insert({ client_user_id: clientUserId, milestone_id: milestoneId, completed_by: user.id } as any);
        if (error) throw error;
      }
    },
    onMutate: async (milestoneId) => {
      await queryClient.cancelQueries({ queryKey: ['csm-milestone-completions', clientUserId] });
      const prev = queryClient.getQueryData<string[]>(['csm-milestone-completions', clientUserId]);
      queryClient.setQueryData<string[]>(['csm-milestone-completions', clientUserId], (old = []) =>
        old.includes(milestoneId) ? old.filter((id) => id !== milestoneId) : [...old, milestoneId]
      );
      return { prev };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(['csm-milestone-completions', clientUserId], context?.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['csm-milestone-completions', clientUserId] });
    },
  });

  const createMilestone = useMutation({
    mutationFn: async (title: string) => {
      const nextOrder = (milestones.length > 0 ? Math.max(...milestones.map(m => m.sort_order)) : 0) + 1;
      const { error } = await supabase
        .from('csm_milestones' as any)
        .insert({ title, sort_order: nextOrder } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['csm-milestones'] });
    },
  });

  return {
    milestones,
    completedIds,
    toggleMilestone: toggleMilestone.mutate,
    createMilestone: createMilestone.mutate,
    isCreating: createMilestone.isPending,
    isLoading: milestonesLoading || completionsLoading,
  };
};
