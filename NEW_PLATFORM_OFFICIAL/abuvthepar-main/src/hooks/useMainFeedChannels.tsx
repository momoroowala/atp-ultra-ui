import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCommunityChannels } from '@/hooks/useCommunityChannels';

export const useMainFeedChannels = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { channels: accessibleChannels } = useCommunityChannels();

  const savedChannelsQuery = useQuery({
    queryKey: ['main-feed-channels', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_main_feed_channels')
        .select('channel_id')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data.map(r => r.channel_id);
    },
    enabled: !!user,
  });

  const savedChannelIds = savedChannelsQuery.data;

  // If user has no saved preferences, show all accessible channels
  const effectiveChannelIds =
    savedChannelIds && savedChannelIds.length > 0
      ? savedChannelIds.filter(id => accessibleChannels.some(c => c.id === id))
      : accessibleChannels.map(c => c.id);

  const toggleChannel = useMutation({
    mutationFn: async (channelId: string) => {
      const currentIds = savedChannelIds ?? [];
      const isCurrentlySelected = currentIds.includes(channelId);

      if (isCurrentlySelected) {
        await supabase
          .from('user_main_feed_channels')
          .delete()
          .eq('user_id', user!.id)
          .eq('channel_id', channelId);
      } else {
        // If no saved preferences yet, save ALL accessible channels minus the toggled one won't work;
        // Instead save all accessible + the new one
        if (currentIds.length === 0) {
          // First time toggling: save all accessible channels (they're all "on" by default)
          // then remove the one being toggled off — but actually they're toggling it ON from default.
          // Since default = all, toggling means removing one.
          const allIds = accessibleChannels.map(c => c.id).filter(id => id !== channelId);
          if (allIds.length > 0) {
            await supabase
              .from('user_main_feed_channels')
              .insert(allIds.map(id => ({ user_id: user!.id, channel_id: id })));
          }
        } else {
          await supabase
            .from('user_main_feed_channels')
            .insert({ user_id: user!.id, channel_id: channelId });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['main-feed-channels'] });
    },
  });

  const setAllChannels = useMutation({
    mutationFn: async (selectAll: boolean) => {
      // Delete all existing preferences
      await supabase
        .from('user_main_feed_channels')
        .delete()
        .eq('user_id', user!.id);

      if (!selectAll) {
        // If deselecting all, insert nothing (but we need at least something to differentiate from "no prefs")
        // We'll handle "empty saved = show none" only if there are saved rows that were deleted
        // Actually let's keep it simple: empty = all. To show none, don't support it.
        // selectAll=false is not a valid state, just reset to defaults.
      }
      // selectAll=true: deleting all rows resets to "show all" default
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['main-feed-channels'] });
    },
  });

  return {
    effectiveChannelIds,
    savedChannelIds: savedChannelIds ?? [],
    hasCustomSelection: (savedChannelIds?.length ?? 0) > 0,
    isLoading: savedChannelsQuery.isLoading,
    toggleChannel,
    setAllChannels,
    accessibleChannels,
  };
};
