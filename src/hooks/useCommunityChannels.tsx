import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface CommunityChannel {
  id: string;
  name: string;
  description: string | null;
  icon_emoji: string;
  created_by: string;
  visible_tier_ids: string[] | null;
  is_active: boolean;
  is_read_only: boolean;
  is_pinned: boolean;
  pin_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateChannelInput {
  name: string;
  description?: string;
  icon_emoji?: string;
  visible_tier_ids?: string[];
  is_read_only?: boolean;
}


const DEFAULT_CHANNELS: CommunityChannel[] = [
  { id: 'default-announcements', name: 'Announcements', description: 'Important updates and news', icon_emoji: '📢', created_by: 'system', visible_tier_ids: null, is_active: true, is_read_only: true, is_pinned: true, pin_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'default-general', name: 'General Chat', description: 'Open discussion for everyone', icon_emoji: '💬', created_by: 'system', visible_tier_ids: null, is_active: true, is_read_only: false, is_pinned: true, pin_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'default-brand-outreach', name: 'Brand Outreach', description: 'Share tips and wins on brand outreach', icon_emoji: '📧', created_by: 'system', visible_tier_ids: null, is_active: true, is_read_only: false, is_pinned: true, pin_order: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'default-shipping', name: 'Shipping', description: 'Shipping logistics and prep center talk', icon_emoji: '📦', created_by: 'system', visible_tier_ids: null, is_active: true, is_read_only: false, is_pinned: false, pin_order: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'default-warehouse', name: 'Warehouse', description: 'Warehouse operations and FBA prep', icon_emoji: '🏭', created_by: 'system', visible_tier_ids: null, is_active: true, is_read_only: false, is_pinned: false, pin_order: 5, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'default-monday-mindset', name: 'Monday Mindset', description: 'Start the week strong', icon_emoji: '💪', created_by: 'system', visible_tier_ids: null, is_active: true, is_read_only: false, is_pinned: false, pin_order: 6, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'default-wins', name: 'Wins', description: 'Celebrate your wins!', icon_emoji: '🏆', created_by: 'system', visible_tier_ids: null, is_active: true, is_read_only: false, is_pinned: false, pin_order: 7, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'default-ticket-support', name: 'Ticket Support', description: 'Get help with your questions', icon_emoji: '🎫', created_by: 'system', visible_tier_ids: null, is_active: true, is_read_only: false, is_pinned: false, pin_order: 8, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const useCommunityChannels = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const channelsQuery = useQuery({
    queryKey: ['community-channels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_channels')
        .select('*')
        .eq('is_active', true)
        .order('is_pinned', { ascending: false })
        .order('pin_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) {
        // Fall back to default channels when Supabase is empty or errors
        return DEFAULT_CHANNELS;
      }
      return data as CommunityChannel[];
    },
    enabled: !!user,
  });

  const createChannel = useMutation({
    mutationFn: async (input: CreateChannelInput) => {
      const { data, error } = await supabase
        .from('community_channels')
        .insert({
          name: input.name,
          description: input.description,
          icon_emoji: input.icon_emoji || '💬',
          visible_tier_ids: input.visible_tier_ids || [],
          is_read_only: input.is_read_only || false,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-channels'] });
      toast.success('Channel created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create channel');
      console.error('Create channel error:', error);
    },
  });

  const updateChannel = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CommunityChannel> & { id: string }) => {
      const { data, error } = await supabase
        .from('community_channels')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-channels'] });
      toast.success('Channel updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update channel');
      console.error('Update channel error:', error);
    },
  });

  const deleteChannel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('community_channels')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-channels'] });
      toast.success('Channel deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete channel');
      console.error('Delete channel error:', error);
    },
  });

  const reorderChannels = useMutation({
    mutationFn: async (updates: { id: string; pin_order: number }[]) => {
      await Promise.all(
        updates.map(({ id, pin_order }) =>
          supabase
            .from('community_channels')
            .update({ pin_order })
            .eq('id', id)
            .then(({ error }) => { if (error) throw error; })
        )
      );
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['community-channels'] });
      const previous = queryClient.getQueryData<CommunityChannel[]>(['community-channels']);
      if (previous) {
        const orderMap = new Map(updates.map(u => [u.id, u.pin_order]));
        const updated = previous.map(ch => orderMap.has(ch.id) ? { ...ch, pin_order: orderMap.get(ch.id)! } : ch);
        updated.sort((a, b) => {
          if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
          if (a.pin_order !== b.pin_order) return a.pin_order - b.pin_order;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
        queryClient.setQueryData(['community-channels'], updated);
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['community-channels'], context.previous);
      }
      toast.error('Failed to reorder channels');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['community-channels'] });
    },
  });

  return {
    channels: channelsQuery.data ?? [],
    isLoading: channelsQuery.isLoading,
    error: channelsQuery.error,
    createChannel,
    updateChannel,
    deleteChannel,
    reorderChannels,
  };
};
