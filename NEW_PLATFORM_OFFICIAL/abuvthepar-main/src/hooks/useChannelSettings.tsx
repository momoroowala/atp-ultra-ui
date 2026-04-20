import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type NotificationLevel = 'all' | 'mentions_only' | 'muted';

export interface ChannelSettings {
  id: string;
  user_id: string;
  channel_id: string;
  notification_level: NotificationLevel;
  created_at: string;
  updated_at: string;
}

export const useChannelSettings = (channelId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ['channel-settings', channelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_user_channel_settings')
        .select('*')
        .eq('channel_id', channelId)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      return data as ChannelSettings | null;
    },
    enabled: !!user && !!channelId,
  });

  const updateSettings = useMutation({
    mutationFn: async (notificationLevel: NotificationLevel) => {
      const { data: existing } = await supabase
        .from('community_user_channel_settings')
        .select('id')
        .eq('channel_id', channelId)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('community_user_channel_settings')
          .update({ notification_level: notificationLevel })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('community_user_channel_settings')
          .insert({
            channel_id: channelId,
            user_id: user?.id,
            notification_level: notificationLevel,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-settings', channelId] });
      toast.success('Notification settings updated');
    },
    onError: (error) => {
      toast.error('Failed to update settings');
      console.error('Update settings error:', error);
    },
  });

  return {
    settings: settingsQuery.data,
    notificationLevel: settingsQuery.data?.notification_level ?? 'all',
    isLoading: settingsQuery.isLoading,
    updateSettings,
  };
};

// Hook for all channel settings
export const useAllChannelSettings = () => {
  const { user } = useAuth();

  const allSettingsQuery = useQuery({
    queryKey: ['all-channel-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_user_channel_settings')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      return data as ChannelSettings[];
    },
    enabled: !!user,
  });

  const getNotificationLevel = (channelId: string): NotificationLevel => {
    const setting = allSettingsQuery.data?.find(s => s.channel_id === channelId);
    return setting?.notification_level ?? 'all';
  };

  return {
    settings: allSettingsQuery.data ?? [],
    isLoading: allSettingsQuery.isLoading,
    getNotificationLevel,
  };
};
