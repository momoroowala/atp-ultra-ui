import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useRef } from 'react';
import { playNotificationSound, isSoundEnabled } from '@/utils/notificationSound';

interface UnreadCounts {
  channelUnreadCounts: Map<string, number>;
  dmUnreadCounts: Map<string, number>;
  totalChannelUnread: number;
  totalDmUnread: number;
  totalUnread: number;
}

export const useUnreadCounts = (activeChannelId?: string, activeConversationId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isInitialMount = useRef(true);
  
  // Use refs for active IDs to avoid recreating subscription on every change
  const activeChannelIdRef = useRef(activeChannelId);
  const activeConversationIdRef = useRef(activeConversationId);
  
  // Keep refs in sync
  useEffect(() => {
    activeChannelIdRef.current = activeChannelId;
  }, [activeChannelId]);
  
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const queryKey = ['unread-counts', user?.id];

  const unreadQuery = useQuery({
    queryKey,
    queryFn: async (): Promise<UnreadCounts> => {
      if (!user) {
        return {
          channelUnreadCounts: new Map(),
          dmUnreadCounts: new Map(),
          totalChannelUnread: 0,
          totalDmUnread: 0,
          totalUnread: 0,
        };
      }

      // Single RPC replaces the previous per-channel + per-DM count loops.
      // The function runs with SECURITY INVOKER so the caller's RLS still
      // scopes visibility exactly like the old client-side queries.
      // Cast to any because this function is newly added and not yet in the
      // auto-generated Supabase types.
      const { data, error } = await supabase.rpc('calculate_all_unread_counts' as any);

      if (error) {
        console.error('[useUnreadCounts] RPC failed:', error);
        return {
          channelUnreadCounts: new Map(),
          dmUnreadCounts: new Map(),
          totalChannelUnread: 0,
          totalDmUnread: 0,
          totalUnread: 0,
        };
      }

      const channelUnreadCounts = new Map<string, number>();
      const dmUnreadCounts = new Map<string, number>();
      let totalChannelUnread = 0;
      let totalDmUnread = 0;

      for (const row of (data || []) as Array<{
        channel_id: string | null;
        dm_conversation_id: string | null;
        unread_count: number;
      }>) {
        const count = Number(row.unread_count) || 0;
        if (count <= 0) continue;
        if (row.channel_id) {
          channelUnreadCounts.set(row.channel_id, count);
          totalChannelUnread += count;
        } else if (row.dm_conversation_id) {
          dmUnreadCounts.set(row.dm_conversation_id, count);
          totalDmUnread += count;
        }
      }

      return {
        channelUnreadCounts,
        dmUnreadCounts,
        totalChannelUnread,
        totalDmUnread,
        totalUnread: totalChannelUnread + totalDmUnread,
      };
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds as backup
  });

  // Real-time subscription for new messages - only recreate when user changes
  useEffect(() => {
    if (!user) return;

    const channelName = `unread-counts-realtime-${user.id}`;
    let mounted = true;
    let removedChannel = false;
    
    // Track initial load to avoid playing sound on first fetch
    const timer = setTimeout(() => { isInitialMount.current = false; }, 2000);
    
    console.log('[Realtime Unread] Setting up subscription for:', channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
        },
        (payload) => {
          if (!mounted) return;
          
          const newMessage = payload.new as any;
          console.log('[Realtime Unread] New message received:', newMessage.id);
          
          // Only process if message is from someone else
          if (newMessage.sender_id !== user.id) {
            // Use refs to get current active channel/conversation
            const isInActiveChannel = activeChannelIdRef.current && newMessage.channel_id === activeChannelIdRef.current;
            const isInActiveDm = activeConversationIdRef.current && newMessage.dm_conversation_id === activeConversationIdRef.current;
            
            // Play sound if message is NOT in the currently viewed channel/conversation
            if (!isInActiveChannel && !isInActiveDm && !isInitialMount.current && isSoundEnabled()) {
              console.log('[Realtime Unread] Playing notification sound');
              playNotificationSound();
            }
            
            // Update unread counts immediately via optimistic update
            queryClient.setQueryData(queryKey, (oldData: UnreadCounts | undefined) => {
              if (!oldData) return oldData;
              
              const newChannelUnreadCounts = new Map(oldData.channelUnreadCounts);
              const newDmUnreadCounts = new Map(oldData.dmUnreadCounts);
              let newTotalChannelUnread = oldData.totalChannelUnread;
              let newTotalDmUnread = oldData.totalDmUnread;
              
              if (newMessage.channel_id && !isInActiveChannel) {
                const currentCount = newChannelUnreadCounts.get(newMessage.channel_id) || 0;
                newChannelUnreadCounts.set(newMessage.channel_id, currentCount + 1);
                newTotalChannelUnread += 1;
              }
              
              if (newMessage.dm_conversation_id && !isInActiveDm) {
                const currentCount = newDmUnreadCounts.get(newMessage.dm_conversation_id) || 0;
                newDmUnreadCounts.set(newMessage.dm_conversation_id, currentCount + 1);
                newTotalDmUnread += 1;
              }
              
              return {
                channelUnreadCounts: newChannelUnreadCounts,
                dmUnreadCounts: newDmUnreadCounts,
                totalChannelUnread: newTotalChannelUnread,
                totalDmUnread: newTotalDmUnread,
                totalUnread: newTotalChannelUnread + newTotalDmUnread,
              };
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime Unread] Subscription status:', status);
      });

    return () => {
      mounted = false;
      clearTimeout(timer);
      if (!removedChannel) {
        removedChannel = true;
        console.log('[Realtime Unread] Cleanup:', channelName);
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id, queryClient]);

  const markChannelAsRead = useMutation({
    mutationFn: async (channelId: string) => {
      if (!user) return;

      const { error } = await supabase
        .from('community_user_channel_settings')
        .upsert(
          {
            user_id: user.id,
            channel_id: channelId,
            last_read_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,channel_id',
          }
        );

      if (error) throw error;
    },
    onMutate: async (channelId: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<UnreadCounts>(queryKey);

      // Optimistically clear the unread badge immediately when the user opens the channel
      queryClient.setQueryData<UnreadCounts>(queryKey, (old) => {
        if (!old) return old;
        const current = old.channelUnreadCounts.get(channelId) || 0;
        if (current === 0) return old;

        const nextChannelUnreadCounts = new Map(old.channelUnreadCounts);
        nextChannelUnreadCounts.delete(channelId);

        const nextTotalChannelUnread = Math.max(0, old.totalChannelUnread - current);
        return {
          channelUnreadCounts: nextChannelUnreadCounts,
          dmUnreadCounts: old.dmUnreadCounts,
          totalChannelUnread: nextTotalChannelUnread,
          totalDmUnread: old.totalDmUnread,
          totalUnread: nextTotalChannelUnread + old.totalDmUnread,
        };
      });

      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const markDmAsRead = useMutation({
    mutationFn: async (conversationId: string) => {
      if (!user) return;

      const now = new Date().toISOString();

      const { error } = await supabase
        .from('community_dm_read_status')
        .upsert(
          {
            user_id: user.id,
            conversation_id: conversationId,
            last_read_at: now,
          },
          {
            onConflict: 'user_id,conversation_id',
          }
        );

      if (error) throw error;

      // Also update community_dm_participants so the CSM panel picks up the read status
      await supabase
        .from('community_dm_participants')
        .update({ last_read_at: now })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);
    },
    onMutate: async (conversationId: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<UnreadCounts>(queryKey);

      // Optimistically clear the unread badge immediately when the user opens the DM
      queryClient.setQueryData<UnreadCounts>(queryKey, (old) => {
        if (!old) return old;
        const current = old.dmUnreadCounts.get(conversationId) || 0;
        if (current === 0) return old;

        const nextDmUnreadCounts = new Map(old.dmUnreadCounts);
        nextDmUnreadCounts.delete(conversationId);

        const nextTotalDmUnread = Math.max(0, old.totalDmUnread - current);
        return {
          channelUnreadCounts: old.channelUnreadCounts,
          dmUnreadCounts: nextDmUnreadCounts,
          totalChannelUnread: old.totalChannelUnread,
          totalDmUnread: nextTotalDmUnread,
          totalUnread: old.totalChannelUnread + nextTotalDmUnread,
        };
      });

      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['community-dm-conversations'] });
    },
  });

  return {
    channelUnreadCounts: unreadQuery.data?.channelUnreadCounts ?? new Map(),
    dmUnreadCounts: unreadQuery.data?.dmUnreadCounts ?? new Map(),
    totalChannelUnread: unreadQuery.data?.totalChannelUnread ?? 0,
    totalDmUnread: unreadQuery.data?.totalDmUnread ?? 0,
    totalUnread: unreadQuery.data?.totalUnread ?? 0,
    isLoading: unreadQuery.isLoading,
    markChannelAsRead,
    markDmAsRead,
  };
};
