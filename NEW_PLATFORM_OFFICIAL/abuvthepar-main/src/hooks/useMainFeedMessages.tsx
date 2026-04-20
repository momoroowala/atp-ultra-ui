import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useRef, useState } from 'react';
import type { CommunityMessage, MessageAttachment } from '@/hooks/useCommunityMessages';

export const useMainFeedMessages = (channelIds: string[]) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const failureCountRef = useRef(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const subscriptionKeyRef = useRef('');

  const queryKey = ['main-feed-messages', channelIds.sort().join(',')];

  const messagesQuery = useQuery({
    queryKey,
    queryFn: async () => {
      if (channelIds.length === 0) return [];

      const { data: messages, error } = await supabase
        .from('community_messages')
        .select('*')
        .eq('is_deleted', false)
        .is('parent_message_id', null)
        .in('channel_id', channelIds)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const filteredMessages = (messages || []).filter(msg => {
        if (!msg.is_hidden) return true;
        if (msg.sender_id === user?.id) return true;
        return false;
      });

      if (filteredMessages.length === 0) return [];

      const senderIds = [...new Set(filteredMessages.map(m => m.sender_id))];
      const messageIds = filteredMessages.map(m => m.id);

      const [{ data: senders }, { data: allReactions }, { data: replyCounts }] = await Promise.all([
        supabase.from('user_public_profiles').select('id, first_name, last_name, user_email, avatar_url').in('id', senderIds),
        supabase.from('community_message_reactions').select('emoji, user_id, message_id').in('message_id', messageIds),
        supabase.from('community_messages').select('parent_message_id').in('parent_message_id', messageIds).eq('is_deleted', false),
      ]);

      const senderMap = new Map(senders?.map(s => [s.id, s]) || []);
      const reactionsMap = new Map<string, { emoji: string; user_id: string }[]>();
      (allReactions || []).forEach(r => {
        if (!reactionsMap.has(r.message_id)) reactionsMap.set(r.message_id, []);
        reactionsMap.get(r.message_id)!.push(r);
      });
      const replyCountMap = new Map<string, number>();
      (replyCounts || []).forEach(r => {
        replyCountMap.set(r.parent_message_id!, (replyCountMap.get(r.parent_message_id!) || 0) + 1);
      });

      return filteredMessages.map(message => {
        const reactions = reactionsMap.get(message.id) || [];
        const reactionMap = new Map<string, { count: number; users: string[] }>();
        reactions.forEach(r => {
          if (!reactionMap.has(r.emoji)) reactionMap.set(r.emoji, { count: 0, users: [] });
          const e = reactionMap.get(r.emoji)!;
          e.count++;
          e.users.push(r.user_id);
        });

        return {
          ...message,
          attachments: (message.attachments || []) as unknown as MessageAttachment[],
          sender: senderMap.get(message.sender_id) || null,
          reactions: Array.from(reactionMap.entries()).map(([emoji, data]) => ({ emoji, ...data })),
          reply_count: replyCountMap.get(message.id) || 0,
        } as CommunityMessage;
      });
    },
    enabled: !!user && channelIds.length > 0,
    refetchOnMount: 'always',
    refetchInterval: realtimeConnected ? false : 5000,
  });

  // Realtime subscription for all selected channels
  useEffect(() => {
    if (!user || channelIds.length === 0) return;

    const key = channelIds.sort().join(',');
    if (subscriptionKeyRef.current === key && channelRef.current) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    subscriptionKeyRef.current = key;

    const channel = supabase
      .channel(`main-feed-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_messages' }, (payload) => {
        const newMsg = payload.new as any;
        if (newMsg?.channel_id && channelIds.includes(newMsg.channel_id)) {
          queryClient.invalidateQueries({ queryKey });
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeConnected(true);
          failureCountRef.current = 0;
        } else if (status === 'CLOSED' || status === 'TIMED_OUT') {
          setRealtimeConnected(false);
          failureCountRef.current++;
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      subscriptionKeyRef.current = '';
    };
  }, [user?.id, channelIds.sort().join(',')]);

  // Pin/unpin/delete/edit mutations for main feed
  const pinMessage = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('community_messages').update({ is_pinned: true, pinned_by: user?.id, pinned_at: new Date().toISOString() }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const unpinMessage = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('community_messages').update({ is_pinned: false, pinned_by: null, pinned_at: null }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteMessage = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('community_messages').update({ is_deleted: true }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const editMessage = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      await supabase.from('community_messages').update({ content, is_edited: true }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    messages: messagesQuery.data ?? [],
    isLoading: messagesQuery.isLoading,
    pinMessage,
    unpinMessage,
    deleteMessage,
    editMessage,
  };
};
