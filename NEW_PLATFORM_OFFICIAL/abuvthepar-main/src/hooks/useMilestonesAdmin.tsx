import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { JourneyMilestone } from './useMilestones';

export const useMilestonesAdmin = () => {
  const queryClient = useQueryClient();

  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ['journey-milestones-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journey_milestones')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as JourneyMilestone[];
    },
  });

  const createMilestone = useMutation({
    mutationFn: async (values: { title: string; sort_order: number }) => {
      const { error } = await supabase.from('journey_milestones').insert(values);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journey-milestones-admin'] });
      queryClient.invalidateQueries({ queryKey: ['journey-milestones'] });
    },
  });

  const updateMilestone = useMutation({
    mutationFn: async ({ id, ...values }: { id: string; title?: string; sort_order?: number; is_active?: boolean }) => {
      const { error } = await supabase.from('journey_milestones').update(values).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journey-milestones-admin'] });
      queryClient.invalidateQueries({ queryKey: ['journey-milestones'] });
    },
  });

  const deleteMilestone = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('journey_milestones').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journey-milestones-admin'] });
      queryClient.invalidateQueries({ queryKey: ['journey-milestones'] });
    },
  });

  return { milestones, isLoading, createMilestone, updateMilestone, deleteMilestone };
};
