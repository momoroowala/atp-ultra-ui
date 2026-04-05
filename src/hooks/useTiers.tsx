import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PageVisibility {
  home?: boolean;
  courses?: boolean;
  my_plan?: boolean;
  calendar?: boolean;
  community?: boolean;
  support?: boolean;
  admin_panel?: boolean;
  support_tickets?: boolean;
  [key: string]: boolean | undefined;
}

export interface Tier {
  id: string;
  tier_key: string;
  display_name: string;
  description: string | null;
  is_active: boolean;
  tier_order: number;
  created_at: string;
  updated_at: string;
  upsell_funnel_url?: string | null;
  feature_access: {
    coaches?: boolean;
    [key: string]: boolean | undefined;
  };
  feature_visibility?: {
    crisp_chat_visible: boolean;
    coaches?: boolean;
    [key: string]: boolean | undefined;
  };
  page_visibility?: PageVisibility;
}

export const useTiers = () => {
  return useQuery({
    queryKey: ['tiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tiers')
        .select('*')
        .eq('is_active', true)
        .order('tier_order');

      if (error) throw error;
      return data as unknown as Tier[];
    },
  });
};

export const useAllTiers = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tiers', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tiers')
        .select('*')
        .order('tier_order');

      if (error) throw error;
      return data as unknown as Tier[];
    },
  });

  const createTier = useMutation({
    mutationFn: async (newTier: Omit<Tier, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('tiers').insert(newTier).select().single();
      if (error) throw error;
      toast.success('Tier created successfully');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiers'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to create tier: ${error.message}`);
    },
  });

  const updateTier = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Tier> }) => {
      const { error } = await supabase
        .from('tiers')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      toast.success('Tier updated successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiers'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update tier: ${error.message}`);
    },
  });

  const deleteTier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tiers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Tier deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiers'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete tier: ${error.message}`);
    },
  });

  return {
    ...query,
    createTier: createTier.mutate,
    createTierAsync: createTier.mutateAsync,
    updateTier: updateTier.mutate,
    deleteTier: deleteTier.mutate,
    isCreating: createTier.isPending,
    isUpdating: updateTier.isPending,
    isDeleting: deleteTier.isPending,
  };
};
