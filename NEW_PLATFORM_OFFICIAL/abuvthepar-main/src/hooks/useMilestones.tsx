import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface JourneyMilestone {
  id: string;
  title: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export const useMilestones = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: milestones = [], isLoading: milestonesLoading } = useQuery({
    queryKey: ['journey-milestones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journey_milestones')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as JourneyMilestone[];
    },
  });

  const { data: completedIds = [], isLoading: completionsLoading } = useQuery({
    queryKey: ['user-journey-milestones', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_journey_milestones')
        .select('milestone_id')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data.map((r) => r.milestone_id);
    },
    enabled: !!user,
  });

  const toggleMilestone = useMutation({
    mutationFn: async (milestoneId: string) => {
      if (!user) throw new Error('Not authenticated');
      const isCompleted = completedIds.includes(milestoneId);
      if (isCompleted) {
        const { error } = await supabase
          .from('user_journey_milestones')
          .delete()
          .eq('user_id', user.id)
          .eq('milestone_id', milestoneId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_journey_milestones')
          .insert({ user_id: user.id, milestone_id: milestoneId });
        if (error) throw error;
      }
    },
    onMutate: async (milestoneId) => {
      await queryClient.cancelQueries({ queryKey: ['user-journey-milestones', user?.id] });
      const prev = queryClient.getQueryData<string[]>(['user-journey-milestones', user?.id]);
      queryClient.setQueryData<string[]>(['user-journey-milestones', user?.id], (old = []) =>
        old.includes(milestoneId) ? old.filter((id) => id !== milestoneId) : [...old, milestoneId]
      );
      return { prev };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(['user-journey-milestones', user?.id], context?.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user-journey-milestones', user?.id] });
    },
  });

  return {
    milestones,
    completedIds,
    toggleMilestone: toggleMilestone.mutate,
    isLoading: milestonesLoading || completionsLoading,
  };
};
