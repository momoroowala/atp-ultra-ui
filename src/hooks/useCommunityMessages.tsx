import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useEffect, useMemo, useRef, useState } from 'react';

export interface MessageAttachment {
  url: string;
  type: 'image' | 'file';
  name: string;
}

export interface CommunityMessage {
  id: string;
  content: string;
  channel_id: string | null;
  dm_conversation_id: string | null;
  sender_id: string;
  parent_message_id: string | null;
  attachments: MessageAttachment[];
  mentions: string[];
  is_edited: boolean;
  is_deleted: boolean;
  is_hidden?: boolean;
  is_flagged?: boolean;
  is_pinned?: boolean;
  pinned_by?: string | null;
  pinned_at?: string | null;
  moderation_status?: string | null;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    user_email: string | null;
    avatar_url: string | null;
  };
  reactions?: {
    emoji: string;
    count: number;
    users: string[];
  }[];
  reply_count?: number;
}

export interface SendMessageInput {
  content: string;
  channel_id?: string;
  dm_conversation_id?: string;
  parent_message_id?: string;
  attachments?: MessageAttachment[];
  mentions?: string[];
  shared_from_thread_id?: string;
}

export const useCommunityMessages = (channelId?: string, dmConversationId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [oldestTimestamp, setOldestTimestamp] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [olderMessages, setOlderMessages] = useState<CommunityMessage[]>([]);

  // Pre-cache the current user's profile to avoid email flashing in optimistic updates
  const { data: cachedUserProfile } = useQuery({
    queryKey: ['user-profile-sender', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_public_profiles')
        .select('id, first_name, last_name, user_email, avatar_url')
        .eq('id', user?.id!)
        .single();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Memoize queryKey to prevent unnecessary re-renders and effect triggers
  const queryKey = useMemo(() => 
    channelId 
      ? ['community-messages', 'channel', channelId]
      : dmConversationId 
      ? ['community-messages', 'dm', dmConversationId]
      : ['community-messages'],
    [channelId, dmConversationId]
  );

  // Reset pagination state when channel changes
  useEffect(() => {
    setOldestTimestamp(null);
    setHasMoreMessages(true);
    setOlderMessages([]);
  }, [channelId, dmConversationId]);

  // Track realtime connection health for polling fallback
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const failureCountRef = useRef(0);

  const messagesQuery = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from('community_messages')
        .select('*')
        .eq('is_deleted', false)
        .is('parent_message_id', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (channelId) {
        // Default/demo channels won't have data in Supabase -- return empty
        if (channelId.startsWith('default-')) {
          setHasMoreMessages(false);
          return [];
        }
        query = query.eq('channel_id', channelId);
      } else if (dmConversationId) {
        // Demo DM conversations -- return placeholder messages
        if (dmConversationId.startsWith('demo-dm-') || dmConversationId.startsWith('local-dm-')) {
          setHasMoreMessages(false);
          const demoMsgs: Record<string, CommunityMessage[]> = {
            'demo-dm-1': [
              { id: 'dm-msg-1', content: 'Hey! How is your brand outreach going this week?', channel_id: null, dm_conversation_id: dmConversationId, sender_id: 'demo-user-1', parent_message_id: null, attachments: [], mentions: [], is_edited: false, is_deleted: false, created_at: new Date(Date.now() - 7200000).toISOString(), updated_at: new Date(Date.now() - 7200000).toISOString(), sender: { id: 'demo-user-1', first_name: 'Coach', last_name: 'Brittany', user_email: 'brittany@atp.com', avatar_url: null }, reactions: [], reply_count: 0 },
              { id: 'dm-msg-2', content: 'Great work on your outreach this week! Keep sending those emails.', channel_id: null, dm_conversation_id: dmConversationId, sender_id: 'demo-user-1', parent_message_id: null, attachments: [], mentions: [], is_edited: false, is_deleted: false, created_at: new Date(Date.now() - 3600000).toISOString(), updated_at: new Date(Date.now() - 3600000).toISOString(), sender: { id: 'demo-user-1', first_name: 'Coach', last_name: 'Brittany', user_email: 'brittany@atp.com', avatar_url: null }, reactions: [], reply_count: 0 },
            ],
            'demo-dm-2': [
              { id: 'dm-msg-3', content: 'Hey, which brands are you focusing on this week?', channel_id: null, dm_conversation_id: dmConversationId, sender_id: 'demo-user-2', parent_message_id: null, attachments: [], mentions: [], is_edited: false, is_deleted: false, created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date(Date.now() - 86400000).toISOString(), sender: { id: 'demo-user-2', first_name: 'Sarah', last_name: 'Chen', user_email: 'sarah@student.com', avatar_url: null }, reactions: [], reply_count: 0 },
            ],
            'demo-dm-3': [
              { id: 'dm-msg-4', content: 'Thanks for the SmartScout tips! Already found 3 good brands.', channel_id: null, dm_conversation_id: dmConversationId, sender_id: 'demo-user-3', parent_message_id: null, attachments: [], mentions: [], is_edited: false, is_deleted: false, created_at: new Date(Date.now() - 172800000).toISOString(), updated_at: new Date(Date.now() - 172800000).toISOString(), sender: { id: 'demo-user-3', first_name: 'Marcus', last_name: 'Rivera', user_email: 'marcus@student.com', avatar_url: null }, reactions: [], reply_count: 0 },
            ],
          };
          return demoMsgs[dmConversationId] || [];
        }
        query = query.eq('dm_conversation_id', dmConversationId);
      } else {
        return [];
      }

      const { data: rawMessages, error } = await query;
      // Reverse so oldest is first for display (we fetched newest-first for the limit)
      const messages = (rawMessages || []).reverse();

      // Track whether there are more messages to load
      if ((rawMessages || []).length < 50) {
        setHasMoreMessages(false);
      } else {
        setHasMoreMessages(true);
      }

      // Track oldest loaded timestamp for "load more"
      if (messages.length > 0) {
        setOldestTimestamp(messages[0].created_at);
      }
      if (error) throw error;
      
      // Filter out hidden messages (unless user is the sender)
      // Hidden messages are those flagged by AI moderation and pending review
      const filteredMessages = (messages || []).filter(msg => {
        // If message is not hidden, show it
        if (!msg.is_hidden) return true;
        // If message is hidden but user is the sender, show it (with warning in UI)
        if (msg.sender_id === user?.id) return true;
        // Otherwise, hide the message from other users
        return false;
      });
      if (!filteredMessages || filteredMessages.length === 0) return [];

      // Get unique sender IDs
      const senderIds = [...new Set(filteredMessages.map(m => m.sender_id))];
      const messageIds = filteredMessages.map(m => m.id);

      // Batch fetch all sender profiles at once
      const { data: senders } = await supabase
        .from('user_public_profiles')
        .select('id, first_name, last_name, user_email, avatar_url')
        .in('id', senderIds);

      // Batch fetch all reactions at once
      const { data: allReactions } = await supabase
        .from('community_message_reactions')
        .select('emoji, user_id, message_id')
        .in('message_id', messageIds);

      // Batch fetch reply counts - get all replies in one query
      const { data: replyCounts } = await supabase
        .from('community_messages')
        .select('parent_message_id')
        .in('parent_message_id', messageIds)
        .eq('is_deleted', false);

      // Create lookup maps
      const senderMap = new Map(senders?.map(s => [s.id, s]) || []);
      
      // Group reactions by message_id
      const reactionsMap = new Map<string, { emoji: string; user_id: string }[]>();
      (allReactions || []).forEach(r => {
        if (!reactionsMap.has(r.message_id)) {
          reactionsMap.set(r.message_id, []);
        }
        reactionsMap.get(r.message_id)!.push(r);
      });

      // Count replies per message
      const replyCountMap = new Map<string, number>();
      (replyCounts || []).forEach(r => {
        const count = replyCountMap.get(r.parent_message_id!) || 0;
        replyCountMap.set(r.parent_message_id!, count + 1);
      });

      // Build final message objects
      const messagesWithDetails = filteredMessages.map(message => {
        const reactions = reactionsMap.get(message.id) || [];
        
        // Group reactions by emoji
        const reactionMap = new Map<string, { count: number; users: string[] }>();
        reactions.forEach((r) => {
          if (!reactionMap.has(r.emoji)) {
            reactionMap.set(r.emoji, { count: 0, users: [] });
          }
          const existing = reactionMap.get(r.emoji)!;
          existing.count++;
          existing.users.push(r.user_id);
        });

        return {
          ...message,
          attachments: (message.attachments || []) as unknown as MessageAttachment[],
          sender: senderMap.get(message.sender_id) || null,
          reactions: Array.from(reactionMap.entries()).map(([emoji, data]) => ({
            emoji,
            ...data,
          })),
          reply_count: replyCountMap.get(message.id) || 0,
        } as CommunityMessage;
      });

      return messagesWithDetails;
    },
    enabled: !!user && !!(channelId || dmConversationId),
    refetchOnMount: 'always',
    refetchInterval: (() => {
      const id = channelId || dmConversationId || '';
      if (id.startsWith('demo-') || id.startsWith('local-') || id.startsWith('default-')) return false;
      return realtimeConnected ? false : 5000;
    })(),
  });

  // Stable realtime subscription using refs to prevent rapid mount/unmount cycles
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const subscriptionKeyRef = useRef<string>('');
  const removedChannelRef = useRef(false);

  useEffect(() => {
    if (!user || (!channelId && !dmConversationId)) return;

    // Skip realtime for demo/local conversations -- no Supabase table to listen to
    const targetId = channelId || dmConversationId || '';
    if (targetId.startsWith('demo-') || targetId.startsWith('local-') || targetId.startsWith('default-')) return;

    const subscriptionKey = targetId;

    // Don't recreate if same channel is already subscribed
    if (subscriptionKeyRef.current === subscriptionKey && channelRef.current) return;

    // Cleanup previous channel if switching
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    subscriptionKeyRef.current = subscriptionKey;
    removedChannelRef.current = false;
    let mounted = true;

    const channelName = `messages-${subscriptionKey}-${Date.now()}`;
    // console.log('[Realtime] Setting up stable subscription for:', channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_messages',
        },
        async (payload) => {
          try {
            if (!mounted) return;

            const eventType = String(payload.eventType);
            const newMessage = payload.new as any;

            if (eventType === 'INSERT') {
              // Skip own messages — already in cache via optimistic update
              if (newMessage.sender_id === user.id) return;

              if (channelId && newMessage.channel_id !== channelId) return;
              if (dmConversationId && newMessage.dm_conversation_id !== dmConversationId) return;

              if (newMessage.parent_message_id) {
                queryClient.invalidateQueries({ queryKey });
                return;
              }

              if (newMessage.is_hidden && newMessage.sender_id !== user.id) return;

              const { data: senderData } = await supabase
                .from('user_public_profiles')
                .select('id, first_name, last_name, user_email, avatar_url')
                .eq('id', newMessage.sender_id)
                .single();

              queryClient.setQueryData(queryKey, (oldData: CommunityMessage[] | undefined) => {
                if (!oldData) return oldData;
                if (oldData.some(m => m.id === newMessage.id)) return oldData;

                const messageToAdd: CommunityMessage = {
                  ...newMessage,
                  attachments: (newMessage.attachments || []) as MessageAttachment[],
                  sender: senderData || null,
                  reactions: [],
                  reply_count: 0,
                };

                return [...oldData, messageToAdd];
              });
            } else if (eventType === 'UPDATE') {
              if (channelId && newMessage.channel_id !== channelId) return;
              if (dmConversationId && newMessage.dm_conversation_id !== dmConversationId) return;

              const isHidden = newMessage.is_hidden;

              queryClient.setQueryData(queryKey, (oldData: CommunityMessage[] | undefined) => {
                if (!oldData) return oldData;

                const existingIndex = oldData.findIndex(m => m.id === newMessage.id);

                if (!isHidden && existingIndex === -1) {
                  queryClient.invalidateQueries({ queryKey });
                  return oldData;
                }

                if (isHidden && newMessage.sender_id !== user.id) {
                  return oldData.filter(m => m.id !== newMessage.id);
                }

                return oldData.map(msg => {
                  if (msg.id === newMessage.id) {
                    return {
                      ...msg,
                      content: newMessage.content,
                      is_edited: newMessage.is_edited,
                      is_deleted: newMessage.is_deleted,
                      is_hidden: newMessage.is_hidden,
                      is_pinned: newMessage.is_pinned,
                      pinned_by: newMessage.pinned_by,
                      pinned_at: newMessage.pinned_at,
                      moderation_status: newMessage.moderation_status,
                    };
                  }
                  return msg;
                }).filter(msg => !msg.is_deleted);
              });
            }
          } catch (err) {
            console.error('[Realtime] Error in message handler:', String(err));
          }
        }
      )
      .subscribe((status) => {
        // console.log('[Realtime] Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setRealtimeConnected(true);
          failureCountRef.current = 0;
        } else if (status === 'CLOSED' || status === 'TIMED_OUT') {
          setRealtimeConnected(false);
          failureCountRef.current++;
          if (failureCountRef.current >= 3) {
            // console.log('[Realtime] Too many failures, falling back to polling');
            // Do NOT call removeChannel here — it causes recursive teardown loops
          }
        }
      });

    channelRef.current = channel;

    return () => {
      mounted = false;
      if (channelRef.current && !removedChannelRef.current) {
        removedChannelRef.current = true;
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      // Reset subscriptionKeyRef so re-mounting with the same key works
      subscriptionKeyRef.current = '';
    };
  }, [user?.id, channelId, dmConversationId]);

  const sendMessage = useMutation({
    mutationFn: async (input: SendMessageInput) => {
      // For channel messages, use the moderation edge function
      // For DMs, insert directly (admins are participants)
      if (input.channel_id) {
        // DEV MODE: Skip moderation edge function, insert directly
        // TODO: Re-enable moderation when edge functions are deployed
        const insertData = {
          content: input.content,
          channel_id: input.channel_id,
          dm_conversation_id: null,
          parent_message_id: input.parent_message_id || null,
          attachments: JSON.stringify(input.attachments || []),
          mentions: input.mentions || [],
          sender_id: user?.id!,
          shared_from_thread_id: input.shared_from_thread_id || null,
          is_flagged: false,
          is_hidden: false,
          moderation_status: 'approved',
        };

        const { data, error } = await supabase
          .from('community_messages')
          .insert(insertData as any)
          .select()
          .single();

        if (error) throw error;

        return { message: data, flagged: false, isReply: !!input.parent_message_id };
      } else {
        // Direct insert for DMs (no moderation needed as admins are involved)
        const insertData = {
          content: input.content,
          channel_id: null,
          dm_conversation_id: input.dm_conversation_id || null,
          parent_message_id: input.parent_message_id || null,
          attachments: JSON.stringify(input.attachments || []),
          mentions: input.mentions || [],
          sender_id: user?.id!,
          shared_from_thread_id: input.shared_from_thread_id || null,
        };
        
        const { data, error } = await supabase
          .from('community_messages')
          .insert(insertData as any)
          .select()
          .single();

        if (error) throw error;
        
        // No need to fetch sender profile here — optimistic update + onSuccess invalidation handles it
        
        // Trigger push notifications
        supabase.functions.invoke('send-push-notification', {
          body: {
            channelId: input.channel_id,
            dmConversationId: input.dm_conversation_id,
            senderId: user?.id,
            messageContent: input.content,
            messageId: data.id,
          },
        }).then(response => {
          if (response.error) {
            console.error('[Push] Notification error:', response.error);
          }
        }).catch(err => console.error('[Push] Failed to send push notification:', err));
        
        return { message: data, flagged: false, isReply: !!input.parent_message_id };
      }
    },
    // Optimistic update: show message immediately while moderation runs
    onMutate: async (input) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });
      
      // Snapshot previous messages
      const previousMessages = queryClient.getQueryData<CommunityMessage[]>(queryKey);
      
      // Only add optimistic message for non-reply messages
      if (input.parent_message_id) {
        return { previousMessages, optimisticId: null };
      }
      
      // Create optimistic message
      const optimisticId = `temp-${Date.now()}`;
      
      // Look up current user's profile: prefer pre-cached query, then cached messages, then email fallback
      const existingSenderProfile = previousMessages?.find(
        m => m.sender_id === user?.id
      )?.sender;
      
      const senderProfile = cachedUserProfile || existingSenderProfile;
      
      const optimisticMessage: CommunityMessage = {
        id: optimisticId,
        content: input.content,
        channel_id: input.channel_id || null,
        dm_conversation_id: input.dm_conversation_id || null,
        sender_id: user?.id!,
        parent_message_id: input.parent_message_id || null,
        attachments: (input.attachments || []) as MessageAttachment[],
        mentions: input.mentions || [],
        is_edited: false,
        is_deleted: false,
        is_hidden: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender: {
          id: user?.id!,
          first_name: senderProfile?.first_name || null,
          last_name: senderProfile?.last_name || null,
          user_email: senderProfile?.user_email || user?.email || null,
          avatar_url: senderProfile?.avatar_url || null,
        },
        reactions: [],
        reply_count: 0,
      };
      
      // Add optimistic message to cache
      queryClient.setQueryData(queryKey, (old: CommunityMessage[] | undefined) => 
        [...(old || []), optimisticMessage]
      );
      
      return { previousMessages, optimisticId };
    },
    onSuccess: ({ message, flagged, isReply }, _input, context) => {
      if (isReply && message.parent_message_id) {
        queryClient.invalidateQueries({ queryKey: ['community-thread', message.parent_message_id] });
        queryClient.invalidateQueries({ queryKey });
        return;
      }
      
      // Swap optimistic temp message with real server data (no full refetch needed)
      if (context?.optimisticId) {
        queryClient.setQueryData(queryKey, (old: CommunityMessage[] | undefined) => {
          if (!old) return old;
          
          const hasOptimistic = old.some(msg => msg.id === context.optimisticId);
          const hasReal = old.some(msg => msg.id === message.id);
          
          if (hasOptimistic) {
            // Normal path: swap temp ID with real ID
            return old.map(msg => 
              msg.id === context.optimisticId 
                ? { ...msg, id: message.id, moderation_status: message.moderation_status, is_flagged: message.is_flagged, is_hidden: message.is_hidden }
                : msg
            );
          } else if (!hasReal) {
            // Optimistic row was lost (race with refetch) — append real message
            const senderProfile = cachedUserProfile || old.find(m => m.sender_id === user?.id)?.sender;
            const realMessage: CommunityMessage = {
              ...message,
              attachments: (message.attachments || []) as unknown as MessageAttachment[],
              mentions: message.mentions || [],
              sender: senderProfile ? {
                id: senderProfile.id,
                first_name: senderProfile.first_name,
                last_name: senderProfile.last_name,
                user_email: senderProfile.user_email,
                avatar_url: senderProfile.avatar_url,
              } : null,
              reactions: [],
              reply_count: 0,
            } as CommunityMessage;
            return [...old, realMessage];
          }
          
          return old;
        });
      }
      
      // Refresh the DM conversations list so last_message updates
      if (dmConversationId) {
        queryClient.invalidateQueries({ queryKey: ['community-dm-conversations'] });
      }
    },
    onError: (error, _input, context) => {
      // Rollback to previous state
      if (context?.previousMessages) {
        queryClient.setQueryData(queryKey, context.previousMessages);
      }
      toast.error('Failed to send message');
      console.error('Send message error:', error);
    },
  });

  const editMessage = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { data, error } = await supabase
        .from('community_messages')
        .update({ content, is_edited: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      toast.error('Failed to edit message');
      console.error('Edit message error:', error);
    },
  });

  const deleteMessage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('community_messages')
        .update({ is_deleted: true })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Message deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete message');
      console.error('Delete message error:', error);
    },
  });

  const pinMessage = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('community_messages')
        .update({
          is_pinned: true,
          pinned_by: user?.id!,
          pinned_at: new Date().toISOString(),
        } as any)
        .eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Message pinned');
    },
    onError: () => toast.error('Failed to pin message'),
  });

  const unpinMessage = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('community_messages')
        .update({
          is_pinned: false,
          pinned_by: null,
          pinned_at: null,
        } as any)
        .eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Message unpinned');
    },
    onError: () => toast.error('Failed to unpin message'),
  });

  const loadMoreMessages = async () => {
    if (!oldestTimestamp || !hasMoreMessages) return;

    let query = supabase
      .from('community_messages')
      .select('*')
      .eq('is_deleted', false)
      .is('parent_message_id', null)
      .lt('created_at', oldestTimestamp)
      .order('created_at', { ascending: false })
      .limit(50);

    if (channelId) {
      query = query.eq('channel_id', channelId);
    } else if (dmConversationId) {
      query = query.eq('dm_conversation_id', dmConversationId);
    } else {
      return;
    }

    const { data: rawMessages, error } = await query;
    if (error) {
      console.error('Load more messages error:', error);
      return;
    }

    const fetchedMessages = (rawMessages || []).reverse();

    if (fetchedMessages.length < 50) {
      setHasMoreMessages(false);
    }

    if (fetchedMessages.length > 0) {
      setOldestTimestamp(fetchedMessages[0].created_at);

      // Fetch sender profiles for the older messages
      const senderIds = [...new Set(fetchedMessages.map(m => m.sender_id))];
      const messageIds = fetchedMessages.map(m => m.id);

      const { data: senders } = await supabase
        .from('user_public_profiles')
        .select('id, first_name, last_name, user_email, avatar_url')
        .in('id', senderIds);

      const { data: allReactions } = await supabase
        .from('community_message_reactions')
        .select('emoji, user_id, message_id')
        .in('message_id', messageIds);

      const { data: replyCounts } = await supabase
        .from('community_messages')
        .select('parent_message_id')
        .in('parent_message_id', messageIds)
        .eq('is_deleted', false);

      const senderMap = new Map((senders || []).map(s => [s.id, s]));

      const reactionsMap = new Map<string, { emoji: string; user_id: string }[]>();
      (allReactions || []).forEach(r => {
        if (!reactionsMap.has(r.message_id)) {
          reactionsMap.set(r.message_id, []);
        }
        reactionsMap.get(r.message_id)!.push(r);
      });

      const replyCountMap = new Map<string, number>();
      (replyCounts || []).forEach(r => {
        const count = replyCountMap.get(r.parent_message_id!) || 0;
        replyCountMap.set(r.parent_message_id!, count + 1);
      });

      const olderWithDetails = fetchedMessages
        .filter(msg => {
          if (!msg.is_hidden) return true;
          if (msg.sender_id === user?.id) return true;
          return false;
        })
        .map(message => {
          const reactions = reactionsMap.get(message.id) || [];
          const reactionMap = new Map<string, { count: number; users: string[] }>();
          reactions.forEach((r) => {
            if (!reactionMap.has(r.emoji)) {
              reactionMap.set(r.emoji, { count: 0, users: [] });
            }
            const existing = reactionMap.get(r.emoji)!;
            existing.count++;
            existing.users.push(r.user_id);
          });

          return {
            ...message,
            attachments: (message.attachments || []) as unknown as MessageAttachment[],
            sender: senderMap.get(message.sender_id) || null,
            reactions: Array.from(reactionMap.entries()).map(([emoji, data]) => ({
              emoji,
              ...data,
            })),
            reply_count: replyCountMap.get(message.id) || 0,
          } as CommunityMessage;
        });

      setOlderMessages(prev => [...olderWithDetails, ...prev]);
    }
  };

  // Combine older loaded messages with the latest page
  const allMessages = useMemo(
    () => [...olderMessages, ...(messagesQuery.data ?? [])],
    [olderMessages, messagesQuery.data]
  );

  return {
    messages: allMessages,
    isLoading: messagesQuery.isLoading,
    error: messagesQuery.error,
    sendMessage,
    editMessage,
    deleteMessage,
    pinMessage,
    unpinMessage,
    loadMoreMessages,
    hasMoreMessages,
  };
};

// Hook for fetching thread replies
export const useThreadReplies = (parentMessageId?: string) => {
  const { user } = useAuth();

  const queryKey = ['community-thread', parentMessageId];

  const repliesQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_messages')
        .select('*')
        .eq('parent_message_id', parentMessageId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Batch fetch all sender profiles in one query
      const senderIds = [...new Set((data || []).map(m => m.sender_id))];
      const { data: senders } = await supabase
        .from('user_public_profiles')
        .select('id, first_name, last_name, user_email, avatar_url')
        .in('id', senderIds);
      const senderMap = new Map((senders || []).map(s => [s.id, s]));

      const repliesWithSenders = (data || []).map((message) => ({
        ...message,
        attachments: (message.attachments || []) as unknown as MessageAttachment[],
        sender: senderMap.get(message.sender_id) || null,
      } as CommunityMessage));

      return repliesWithSenders;
    },
    enabled: !!user && !!parentMessageId,
  });

  return {
    replies: repliesQuery.data ?? [],
    isLoading: repliesQuery.isLoading,
    error: repliesQuery.error,
  };
};
